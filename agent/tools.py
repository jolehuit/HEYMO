"""
Function tools — real API integrations with mock fallbacks.

Each function:
1. Tries the real API first (Linkup / Thryve)
2. Falls back to mock data if the API is unavailable or returns bad data
3. Logs whether real or mock data was used

The mock data matches the contracts in frontend/lib/types.ts.
"""

import json
import os
import re
import logging
from pathlib import Path
from datetime import datetime, timedelta

from dotenv import load_dotenv

# Load .env from the agent/ directory
load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger("alan-tools")

PATIENTS_FILE = Path(__file__).parent / "patients.json"


# ==========================================================================
# PATIENT DATA (Dev 2)
# ==========================================================================

def load_patient(patient_id: str) -> dict:
    """Load a patient profile from patients.json.

    Returns the full patient dict. Falls back to sophie_martin if not found.
    """
    with open(PATIENTS_FILE) as f:
        patients = json.load(f)
    patient = patients.get(patient_id)
    if not patient:
        logger.warning(f"Patient {patient_id} not found, defaulting to sophie_martin")
        patient = patients["sophie_martin"]
    return patient


# ==========================================================================
# REIMBURSEMENT (Dev 2)
#
# Interface: get_reimbursement_info(procedure, patient) → dict
# Returns:   { procedure, average_price, secu_rate, secu_reimbursement,
#              alan_reimbursement, out_of_pocket, direct_billing }
#
# TODO(Dev2): Replace mock with Linkup API search.
# The Linkup SDK is already installed (linkup-sdk).
# Usage:
#   from linkup import LinkupClient
#   client = LinkupClient()  # reads LINKUP_API_KEY from env
#   result = await client.async_search(
#       query="taux remboursement sécurité sociale [procedure] France",
#       depth="standard",
#       output_type="sourcedAnswer",
#       timeout=10.0,
#   )
#   # result.answer = text answer, result.sources = list of sources
#
# If Linkup returns unusable data, fall back to MOCK_REIMBURSEMENTS below.
# ==========================================================================

MOCK_REIMBURSEMENTS = {
    "general_consultation":    {"procedure": "General practitioner consultation", "average_price": 26.50, "secu_rate": 0.70, "secu_reimbursement": 18.55},
    "specialist_consultation": {"procedure": "Specialist consultation",          "average_price": 50.00, "secu_rate": 0.70, "secu_reimbursement": 35.00},
    "physiotherapy":           {"procedure": "Physiotherapy session",             "average_price": 30.00, "secu_rate": 0.60, "secu_reimbursement": 18.00},
    "blood_test":              {"procedure": "Blood test (standard panel)",       "average_price": 40.00, "secu_rate": 0.60, "secu_reimbursement": 24.00},
    "ultrasound":              {"procedure": "Ultrasound examination",            "average_price": 75.00, "secu_rate": 0.70, "secu_reimbursement": 52.50},
    "mri":                     {"procedure": "MRI scan",                          "average_price": 300.0, "secu_rate": 0.70, "secu_reimbursement": 210.0},
    "xray":                    {"procedure": "X-ray",                             "average_price": 45.00, "secu_rate": 0.70, "secu_reimbursement": 31.50},
    "teleconsultation":        {"procedure": "Teleconsultation",                  "average_price": 26.50, "secu_rate": 0.70, "secu_reimbursement": 18.55},
    "endocrinologist":         {"procedure": "Endocrinologist consultation",      "average_price": 50.00, "secu_rate": 0.70, "secu_reimbursement": 35.00},
    "gynecologist":            {"procedure": "Gynecologist consultation",         "average_price": 60.00, "secu_rate": 0.70, "secu_reimbursement": 42.00},
    "morphology_ultrasound":   {"procedure": "Morphology ultrasound (pregnancy)", "average_price": 100.0, "secu_rate": 1.00, "secu_reimbursement": 100.0},
    "glucose_tolerance_test":  {"procedure": "Glucose tolerance test",            "average_price": 35.00, "secu_rate": 1.00, "secu_reimbursement": 35.00},
}


def _compute_alan_reimbursement(base: dict, patient: dict) -> dict:
    """Compute Alan complementary + out-of-pocket from a base reimbursement dict."""
    complementary_rate = patient["contract"]["complementary_rate"]
    remaining = base["average_price"] - base["secu_reimbursement"]
    alan_reimbursement = round(remaining * complementary_rate, 2)
    out_of_pocket = round(remaining - alan_reimbursement, 2)

    return {
        "procedure": base["procedure"],
        "average_price": base["average_price"],
        "secu_rate": base["secu_rate"],
        "secu_reimbursement": base["secu_reimbursement"],
        "alan_reimbursement": alan_reimbursement,
        "out_of_pocket": max(0, out_of_pocket),
        "direct_billing": out_of_pocket <= 0,
    }


# Expected price ranges for sanity-checking parsed data (EUR)
_PRICE_RANGES = {
    "general_consultation":    (20, 60),
    "specialist_consultation": (30, 100),
    "physiotherapy":           (20, 60),
    "blood_test":              (15, 80),
    "ultrasound":              (40, 150),
    "mri":                     (150, 600),
    "xray":                    (20, 100),
    "teleconsultation":        (15, 60),
    "endocrinologist":         (30, 100),
    "gynecologist":            (30, 120),
    "morphology_ultrasound":   (60, 200),
    "glucose_tolerance_test":  (20, 80),
}


def _parse_linkup_answer(answer: str, procedure: str) -> dict | None:
    """Extract structured reimbursement data from a Linkup text answer.

    Strategy: extract the sécu reimbursement rate (%) from Linkup,
    but use our reference prices (from MOCK_REIMBURSEMENTS) for amounts.
    This avoids bad price parsing while getting real taux from the API.

    Also tries to extract a real price if it falls within the expected range.

    Returns a base dict or None if parsing fails.
    """
    try:
        mock_base = MOCK_REIMBURSEMENTS.get(procedure)
        if not mock_base:
            return None

        # Extract percentages — look for sécu-related ones (60%, 70%, 100%)
        pct_matches = re.findall(r"(\d{1,3})\s*%", answer)
        valid_secu_rates = [int(p) for p in pct_matches if int(p) in (60, 70, 80, 100)]

        if not valid_secu_rates:
            return None

        secu_rate = valid_secu_rates[0] / 100.0

        # Try to extract a plausible price
        euro_matches = re.findall(r"(\d+[,\.]\d{2})\s*(?:€|euro)", answer, re.IGNORECASE)
        if not euro_matches:
            euro_matches = re.findall(r"(\d+)\s*(?:€|euro)", answer, re.IGNORECASE)

        average_price = mock_base["average_price"]  # default to mock price
        price_range = _PRICE_RANGES.get(procedure, (5, 500))

        for match in euro_matches:
            candidate = float(match.replace(",", "."))
            if price_range[0] <= candidate <= price_range[1]:
                average_price = candidate
                break

        secu_reimbursement = round(average_price * secu_rate, 2)

        return {
            "procedure": mock_base["procedure"],
            "average_price": average_price,
            "secu_rate": secu_rate,
            "secu_reimbursement": secu_reimbursement,
        }
    except (ValueError, IndexError):
        return None


# Procedure name mapping for Linkup queries
PROCEDURE_FR_NAMES = {
    "general_consultation": "consultation médecin généraliste secteur 1",
    "specialist_consultation": "consultation spécialiste secteur 1 tarif",
    "physiotherapy": "séance kinésithérapie tarif conventionnel remboursement",
    "blood_test": "prise de sang bilan standard tarif remboursement",
    "ultrasound": "échographie tarif remboursement sécurité sociale",
    "mri": "IRM tarif remboursement sécurité sociale",
    "xray": "radiographie tarif remboursement",
    "teleconsultation": "téléconsultation tarif remboursement",
    "endocrinologist": "consultation endocrinologue tarif remboursement",
    "gynecologist": "consultation gynécologue tarif remboursement",
    "morphology_ultrasound": "échographie morphologique grossesse remboursement",
    "glucose_tolerance_test": "test tolérance glucose grossesse remboursement",
}


async def get_reimbursement_info(procedure: str, patient: dict) -> dict:
    """Get reimbursement info for a procedure.

    Tries Linkup API to get real sécu rates, falls back to mock data.
    Uses reference prices validated against expected ranges.
    """
    # --- Try Linkup API ---
    linkup_api_key = os.environ.get("LINKUP_API_KEY")
    if linkup_api_key:
        try:
            from linkup import LinkupClient

            client = LinkupClient()
            procedure_fr = PROCEDURE_FR_NAMES.get(procedure, procedure)
            query = f"taux remboursement sécurité sociale {procedure_fr} France 2025"

            result = await client.async_search(
                query=query,
                depth="standard",
                output_type="sourcedAnswer",
                timeout=10.0,
            )

            parsed = _parse_linkup_answer(result.answer, procedure)
            if parsed:
                logger.info(f"Linkup: got real rate ({parsed['secu_rate']:.0%}) for '{procedure}' — price {parsed['average_price']}€")
                return _compute_alan_reimbursement(parsed, patient)
            else:
                logger.warning(f"Linkup: no valid sécu rate found for '{procedure}', falling back to mock")

        except Exception as e:
            logger.warning(f"Linkup API error for '{procedure}': {e}. Falling back to mock.")

    # --- Fallback: mock data ---
    logger.info(f"Using mock reimbursement data for '{procedure}'")
    base = MOCK_REIMBURSEMENTS.get(procedure, MOCK_REIMBURSEMENTS["specialist_consultation"])
    return _compute_alan_reimbursement(base, patient)


# ==========================================================================
# WEARABLE DATA (Dev 2)
#
# Interface: get_wearable_data(patient_id, thryve_user_id) → dict
# Returns:   { source, period, heart_rate{...}, sleep{...}, activity{...},
#              risk_patterns[] }
#
# TODO(Dev2): Replace mock with real Thryve API call.
#
# THRYVE API DOCS: https://docs.thryve.health
# API reference: https://docs.thryve.health/further-resources/v5-api-reference
#
# SANDBOX: ~10 user profiles with 1+ year of real health data
#          (activity, sleep, vitals including heart rate)
#          Data from mixed tracker sources (Fitbit, Garmin, Oura, etc.)
#
# TWO ENDPOINTS:
#   1. Daily summaries → "Get daily data" in docs
#   2. Intraday (epoch-level) data → "Get epoch data" in docs
#
# ANALYTICS MODULE: Thryve also provides standardised health insights
#   and risk patterns on top of raw data. Check "Analytics Platform" in docs.
#
# Biomarker IDs we need:
#   1000  = Steps (Daily, count)
#   2000  = SleepDuration (Daily, minutes — excludes wake times)
#   2001  = SleepInBedDuration (Daily, minutes — includes wake times)
#   3000  = HeartRate (Daily avg bpm, or Epoch for time-series)
#   3001  = HeartRateResting (Daily, avg bpm)
#   1010  = BurnedCalories (Daily, kcal)
#   1100  = ActivityDuration (Daily, minutes)
#
# Data source IDs (for "source" field):
#   1 = Fitbit, 2 = Garmin, 3 = Polar, 5 = Apple Health,
#   6 = Samsung Health, 8 = Withings, 18 = Oura, 42 = Whoop
#
# Auth: API key from Thryve dashboard (given at hackathon)
#   → set THRYVE_API_KEY and THRYVE_APP_ID in .env
#
# Steps to integrate:
#   1. Get API key + sandbox user IDs from hackathon mentors
#   2. Check the "Get daily data" endpoint in the v5 API reference
#   3. Fetch biomarkers 1000 (steps), 2000 (sleep), 3001 (resting HR)
#      for the past 7 days for a sandbox user
#   4. Transform into our format: { heart_rate{...}, sleep{...}, activity{...} }
#   5. Compare last 7 days vs previous 30 days for trend computation
#   6. Optionally use the Analytics module for health insights / risk patterns
#   7. Map sandbox user IDs to our patient profiles in patients.json
#      (update thryve_user_id field for each patient)
#   8. If API doesn't work → keep mock data, demo is identical
#
# The mock data below is medically realistic for each patient scenario.
# ==========================================================================

MOCK_WEARABLES = {
    "sophie_martin": {
        "source": "Fitbit",
        "period": "last_7_days",
        "heart_rate": {"current_resting_avg": 78, "baseline_resting_avg": 65, "trend": "elevated"},
        "sleep":      {"current_avg_hours": 5.5, "baseline_avg_hours": 7.2, "trend": "declining"},
        "activity":   {"current_avg_steps": 2100, "baseline_avg_steps": 8500, "trend": "significantly_reduced"},
        "risk_patterns": ["elevated_hr_post_surgery", "sleep_deficit"],
    },
    "marc_dubois": {
        "source": "Apple Watch",
        "period": "last_7_days",
        "heart_rate": {"current_resting_avg": 72, "baseline_resting_avg": 70, "trend": "stable"},
        "sleep":      {"current_avg_hours": 6.8, "baseline_avg_hours": 7.0, "trend": "stable"},
        "activity":   {"current_avg_steps": 5200, "baseline_avg_steps": 6000, "trend": "slightly_reduced"},
        "risk_patterns": [],
    },
    "lea_chen": {
        "source": "Garmin",
        "period": "last_7_days",
        "heart_rate": {"current_resting_avg": 82, "baseline_resting_avg": 68, "trend": "elevated"},
        "sleep":      {"current_avg_hours": 6.2, "baseline_avg_hours": 7.8, "trend": "declining"},
        "activity":   {"current_avg_steps": 4800, "baseline_avg_steps": 9000, "trend": "reduced"},
        "risk_patterns": ["elevated_hr_pregnancy_normal", "reduced_activity_pregnancy_normal"],
    },
}


def _compute_trend(current: float, baseline: float) -> str:
    """Compute a trend label from current vs baseline values."""
    if baseline == 0:
        return "unknown"
    ratio = current / baseline
    if ratio < 0.5:
        return "significantly_reduced"
    elif ratio < 0.8:
        return "reduced"
    elif ratio < 0.9:
        return "slightly_reduced"
    elif ratio <= 1.1:
        return "stable"
    elif ratio <= 1.2:
        return "slightly_elevated"
    else:
        return "elevated"


# Data source ID → friendly name mapping
_THRYVE_DATA_SOURCES = {
    1: "Fitbit", 2: "Garmin", 3: "Polar", 5: "Apple Health",
    6: "Samsung Health", 8: "Withings", 18: "Oura", 42: "Whoop",
}

# Biomarker IDs
_BIO_STEPS = 1000
_BIO_SLEEP = 2000
_BIO_RESTING_HR = 3001


async def _fetch_thryve_data(
    thryve_user_id: str,
    start_date: str,
    end_date: str,
    value_types: list[int] | None = None,
) -> list | None:
    """Fetch daily data from Thryve v5 QA API.

    Hackathon guide: /Users/lennynapieraj/Downloads/thryve-hackathon-guide.md
    URL: POST https://api-qa.thryve.de/v5/dailyDynamicValues
    Content-Type: application/x-www-form-urlencoded (NOT JSON!)
    Auth: Two Basic Auth headers:
      - Authorization: Basic base64(THRYVE_WEB_USER:THRYVE_WEB_PASSWORD)
      - AppAuthorization: Basic base64(THRYVE_APP_AUTH_ID:THRYVE_APP_AUTH_SECRET)
    Body params (form-urlencoded):
      - authenticationToken = endUserId of the sandbox user
      - startDay / endDay = YYYY-MM-DD
      - valueTypes = comma-separated biomarker IDs (optional)
      - displayTypeName = true
      - detailed = true
    """
    web_user = os.environ.get("THRYVE_WEB_USER")
    web_pass = os.environ.get("THRYVE_WEB_PASSWORD")
    app_auth_id = os.environ.get("THRYVE_APP_AUTH_ID")
    app_auth_secret = os.environ.get("THRYVE_APP_AUTH_SECRET")

    if not all([web_user, web_pass, app_auth_id, app_auth_secret]):
        return None

    try:
        import httpx
        from base64 import b64encode
    except ImportError:
        logger.warning("httpx not installed, cannot call Thryve API")
        return None

    # QA environment for hackathon
    url = "https://api-qa.thryve.de/v5/dailyDynamicValues"

    # Two separate Basic Auth headers
    web_auth = b64encode(f"{web_user}:{web_pass}".encode()).decode()
    app_auth = b64encode(f"{app_auth_id}:{app_auth_secret}".encode()).decode()

    headers = {
        "Authorization": f"Basic {web_auth}",
        "AppAuthorization": f"Basic {app_auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    # Form-urlencoded body (NOT JSON)
    form_data = {
        "authenticationToken": thryve_user_id,
        "startDay": start_date,
        "endDay": end_date,
        "displayTypeName": "true",
        "detailed": "true",
    }
    if value_types:
        form_data["valueTypes"] = ",".join(str(v) for v in value_types)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, data=form_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Thryve: got {response.status_code} for user '{thryve_user_id}' ({start_date}→{end_date})")
                return data
            else:
                logger.warning(f"Thryve API returned {response.status_code}: {response.text[:300]}")
                return None
    except Exception as e:
        logger.warning(f"Thryve API error: {e}")
        return None


def _extract_biomarker_avg(thryve_response: list | dict, biomarker_id: int) -> float | None:
    """Extract average value for a biomarker ID from Thryve response.

    Thryve v5 response format:
    [
      {
        "authenticationToken": "...",
        "dataSources": [
          {
            "dataSource": 1,        # source ID (Fitbit=1, etc.)
            "data": [
              {
                "day": "2026-04-01",
                "dailyDynamicValueType": "1000",   # biomarker ID as string
                "value": "8500",                    # value as string
                ...
              }
            ]
          }
        ]
      }
    ]
    """
    values = []
    records = thryve_response if isinstance(thryve_response, list) else [thryve_response]

    for record in records:
        data_sources = record.get("dataSources", [])
        if not isinstance(data_sources, list):
            continue
        for source in data_sources:
            data_points = source.get("data", [])
            if not isinstance(data_points, list):
                continue
            for dp in data_points:
                type_id = dp.get("dailyDynamicValueType", "")
                if str(type_id) == str(biomarker_id):
                    raw_val = dp.get("value")
                    if raw_val is not None:
                        try:
                            values.append(float(raw_val))
                        except (ValueError, TypeError):
                            pass

    return sum(values) / len(values) if values else None


def _detect_thryve_source(thryve_response: list | dict) -> str:
    """Detect the wearable data source from Thryve response."""
    records = thryve_response if isinstance(thryve_response, list) else [thryve_response]
    for record in records:
        data_sources = record.get("dataSources", [])
        if isinstance(data_sources, list) and data_sources:
            src_id = data_sources[0].get("dataSource")
            if src_id is not None:
                return _THRYVE_DATA_SOURCES.get(int(src_id), f"Source {src_id}")
    return "Unknown"


def _transform_thryve_data(data_7d: list | dict, data_30d: list | dict, patient_id: str) -> dict | None:
    """Transform raw Thryve v5 API data into our internal format.

    Returns the formatted dict or None if data is insufficient.
    """
    try:
        # Current (7 days)
        steps_7d = _extract_biomarker_avg(data_7d, _BIO_STEPS)
        sleep_7d = _extract_biomarker_avg(data_7d, _BIO_SLEEP)  # minutes
        hr_7d = _extract_biomarker_avg(data_7d, _BIO_RESTING_HR)

        # Baseline (30 days)
        steps_30d = _extract_biomarker_avg(data_30d, _BIO_STEPS)
        sleep_30d = _extract_biomarker_avg(data_30d, _BIO_SLEEP)
        hr_30d = _extract_biomarker_avg(data_30d, _BIO_RESTING_HR)

        # Need at least HR or steps to be useful
        if hr_7d is None and steps_7d is None:
            logger.warning(f"Thryve: no HR or steps data for '{patient_id}'")
            return None

        source = _detect_thryve_source(data_7d)

        result = {
            "source": source,
            "period": "last_7_days",
            "heart_rate": {
                "current_resting_avg": round(hr_7d) if hr_7d else 0,
                "baseline_resting_avg": round(hr_30d) if hr_30d else 0,
                "trend": _compute_trend(hr_7d, hr_30d) if hr_7d and hr_30d else "unknown",
            },
            "sleep": {
                "current_avg_hours": round(sleep_7d / 60, 1) if sleep_7d else 0,
                "baseline_avg_hours": round(sleep_30d / 60, 1) if sleep_30d else 0,
                "trend": _compute_trend(sleep_7d, sleep_30d) if sleep_7d and sleep_30d else "unknown",
            },
            "activity": {
                "current_avg_steps": round(steps_7d) if steps_7d else 0,
                "baseline_avg_steps": round(steps_30d) if steps_30d else 0,
                "trend": _compute_trend(steps_7d, steps_30d) if steps_7d and steps_30d else "unknown",
            },
            "risk_patterns": [],
        }

        # Detect risk patterns
        if hr_7d and hr_30d and hr_7d > hr_30d * 1.15:
            result["risk_patterns"].append("elevated_resting_hr")
        if sleep_7d and sleep_30d and sleep_7d < sleep_30d * 0.75:
            result["risk_patterns"].append("sleep_deficit")
        if steps_7d and steps_30d and steps_7d < steps_30d * 0.5:
            result["risk_patterns"].append("significantly_reduced_activity")

        return result

    except Exception as e:
        logger.warning(f"Failed to transform Thryve data: {e}")
        return None


async def get_wearable_data(patient_id: str, thryve_user_id: str) -> dict:
    """Get wearable data for a patient.

    Tries Thryve v5 API first, falls back to mock data.
    Fetches biomarkers: Steps (1000), Sleep (2000), Resting HR (3001)
    for 7-day current period and 30-day baseline.
    """
    # --- Try Thryve API ---
    if thryve_user_id and os.environ.get("THRYVE_WEB_USER"):
        today = datetime.now()
        end = today.strftime("%Y-%m-%d")
        start_7d = (today - timedelta(days=7)).strftime("%Y-%m-%d")
        start_30d = (today - timedelta(days=30)).strftime("%Y-%m-%d")

        biomarkers = [_BIO_STEPS, _BIO_SLEEP, _BIO_RESTING_HR]

        data_7d = await _fetch_thryve_data(thryve_user_id, start_7d, end, biomarkers)
        data_30d = await _fetch_thryve_data(thryve_user_id, start_30d, end, biomarkers)

        if data_7d and data_30d:
            transformed = _transform_thryve_data(data_7d, data_30d, patient_id)
            if transformed:
                logger.info(f"Thryve: real data for '{patient_id}' — source={transformed['source']}")
                return transformed
            else:
                logger.warning(f"Thryve: transform failed for '{patient_id}', using mock")
        else:
            logger.warning(f"Thryve: no API data for '{patient_id}', using mock")

    # --- Fallback: mock data ---
    logger.info(f"Using mock wearable data for patient '{patient_id}'")
    return MOCK_WEARABLES.get(patient_id, MOCK_WEARABLES["sophie_martin"])
