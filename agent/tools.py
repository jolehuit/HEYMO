"""
Function tools for the Alan health follow-up agent.
These are called by the LLM during conversation via LiveKit's @function_tool decorator.

Owner: Dev 2
- get_patient_context() → loads patient profile from patients.json
- get_reimbursement_info() → Linkup API search or hardcoded fallback
- get_wearable_insights() → Thryve API or hardcoded fallback

All tools return the exact JSON structures from the data contracts in the PRD.
"""

import json
import os
import logging
from pathlib import Path

logger = logging.getLogger("alan-tools")

# ---------------------------------------------------------------------------
# PATIENT DATA
# ---------------------------------------------------------------------------

_PATIENTS_FILE = Path(__file__).parent / "patients.json"


def load_patient(patient_id: str) -> dict:
    """Load a patient profile from patients.json."""
    with open(_PATIENTS_FILE) as f:
        patients = json.load(f)
    patient = patients.get(patient_id)
    if not patient:
        logger.warning(f"Patient {patient_id} not found, defaulting to sophie_martin")
        patient = patients["sophie_martin"]
    return patient


# ---------------------------------------------------------------------------
# REIMBURSEMENT — Linkup API with hardcoded fallback
# ---------------------------------------------------------------------------

# Hardcoded French sécu reimbursement rates (public data from ameli.fr)
# Used as fallback if Linkup API is unavailable or returns unusable data
REIMBURSEMENT_DB = {
    "general_consultation": {
        "procedure": "General practitioner consultation",
        "average_price": 26.50,
        "secu_rate": 0.70,
        "secu_reimbursement": 18.55,
    },
    "specialist_consultation": {
        "procedure": "Specialist consultation",
        "average_price": 50.0,
        "secu_rate": 0.70,
        "secu_reimbursement": 35.0,
    },
    "orthopedic_surgery": {
        "procedure": "Orthopedic surgery (arthroscopy)",
        "average_price": 500.0,
        "secu_rate": 0.80,
        "secu_reimbursement": 400.0,
    },
    "physiotherapy": {
        "procedure": "Physiotherapy session",
        "average_price": 30.0,
        "secu_rate": 0.60,
        "secu_reimbursement": 18.0,
    },
    "blood_test": {
        "procedure": "Blood test (standard panel)",
        "average_price": 40.0,
        "secu_rate": 0.60,
        "secu_reimbursement": 24.0,
    },
    "ultrasound": {
        "procedure": "Ultrasound examination",
        "average_price": 75.0,
        "secu_rate": 0.70,
        "secu_reimbursement": 52.50,
    },
    "mri": {
        "procedure": "MRI scan",
        "average_price": 300.0,
        "secu_rate": 0.70,
        "secu_reimbursement": 210.0,
    },
    "xray": {
        "procedure": "X-ray",
        "average_price": 45.0,
        "secu_rate": 0.70,
        "secu_reimbursement": 31.50,
    },
    "dental_checkup": {
        "procedure": "Dental check-up",
        "average_price": 30.0,
        "secu_rate": 0.70,
        "secu_reimbursement": 21.0,
    },
    "teleconsultation": {
        "procedure": "Teleconsultation",
        "average_price": 26.50,
        "secu_rate": 0.70,
        "secu_reimbursement": 18.55,
    },
    "endocrinologist": {
        "procedure": "Endocrinologist consultation",
        "average_price": 50.0,
        "secu_rate": 0.70,
        "secu_reimbursement": 35.0,
    },
    "gynecologist": {
        "procedure": "Gynecologist consultation",
        "average_price": 60.0,
        "secu_rate": 0.70,
        "secu_reimbursement": 42.0,
    },
    "morphology_ultrasound": {
        "procedure": "Morphology ultrasound (pregnancy)",
        "average_price": 100.0,
        "secu_rate": 1.0,
        "secu_reimbursement": 100.0,
    },
    "glucose_tolerance_test": {
        "procedure": "Glucose tolerance test",
        "average_price": 35.0,
        "secu_rate": 1.0,
        "secu_reimbursement": 35.0,
    },
}


def _compute_reimbursement(base: dict, complementary_rate: float) -> dict:
    """Compute Alan's reimbursement on top of sécu."""
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


async def search_reimbursement_linkup(procedure_query: str) -> dict | None:
    """Search Linkup API for reimbursement info. Returns None if unavailable."""
    api_key = os.environ.get("LINKUP_API_KEY")
    if not api_key:
        logger.info("LINKUP_API_KEY not set, using hardcoded reimbursement data")
        return None

    try:
        from linkup import LinkupClient

        client = LinkupClient(api_key=api_key)
        result = await client.async_search(
            query=f"taux remboursement sécurité sociale {procedure_query} France 2025 2026",
            depth="standard",
            output_type="sourcedAnswer",
            include_domains=["ameli.fr", "service-public.fr"],
            timeout=10.0,
        )
        # Return the sourced answer — the LLM will extract relevant numbers
        return {
            "source": "linkup",
            "answer": result.answer,
            "sources": [{"name": s.name, "url": s.url} for s in result.sources[:3]],
        }
    except Exception as e:
        logger.warning(f"Linkup API error: {e}, falling back to hardcoded data")
        return None


def get_reimbursement_from_db(procedure_key: str, complementary_rate: float) -> dict:
    """Get reimbursement info from hardcoded database."""
    base = REIMBURSEMENT_DB.get(procedure_key)
    if not base:
        # Default to specialist consultation
        base = REIMBURSEMENT_DB["specialist_consultation"]
    return _compute_reimbursement(base, complementary_rate)


# ---------------------------------------------------------------------------
# WEARABLE DATA — Thryve API with hardcoded fallback
# ---------------------------------------------------------------------------

# Hardcoded wearable data per patient (used until Thryve API is connected)
HARDCODED_WEARABLES = {
    "sophie_martin": {
        "source": "Fitbit",
        "period": "last_7_days",
        "heart_rate": {
            "current_resting_avg": 78,
            "baseline_resting_avg": 65,
            "trend": "elevated",
        },
        "sleep": {
            "current_avg_hours": 5.5,
            "baseline_avg_hours": 7.2,
            "trend": "declining",
        },
        "activity": {
            "current_avg_steps": 2100,
            "baseline_avg_steps": 8500,
            "trend": "significantly_reduced",
        },
        "risk_patterns": ["elevated_hr_post_surgery", "sleep_deficit"],
    },
    "marc_dubois": {
        "source": "Apple Watch",
        "period": "last_7_days",
        "heart_rate": {
            "current_resting_avg": 72,
            "baseline_resting_avg": 70,
            "trend": "stable",
        },
        "sleep": {
            "current_avg_hours": 6.8,
            "baseline_avg_hours": 7.0,
            "trend": "stable",
        },
        "activity": {
            "current_avg_steps": 5200,
            "baseline_avg_steps": 6000,
            "trend": "slightly_reduced",
        },
        "risk_patterns": [],
    },
    "lea_chen": {
        "source": "Garmin",
        "period": "last_7_days",
        "heart_rate": {
            "current_resting_avg": 82,
            "baseline_resting_avg": 68,
            "trend": "elevated",
        },
        "sleep": {
            "current_avg_hours": 6.2,
            "baseline_avg_hours": 7.8,
            "trend": "declining",
        },
        "activity": {
            "current_avg_steps": 4800,
            "baseline_avg_steps": 9000,
            "trend": "reduced",
        },
        "risk_patterns": ["elevated_hr_pregnancy_normal", "reduced_activity_pregnancy_normal"],
    },
}


async def fetch_wearable_thryve(thryve_user_id: str) -> dict | None:
    """Fetch wearable data from Thryve API. Returns None if unavailable."""
    api_key = os.environ.get("THRYVE_API_KEY")
    app_id = os.environ.get("THRYVE_APP_ID")
    if not api_key or not app_id:
        logger.info("THRYVE credentials not set, using hardcoded wearable data")
        return None

    try:
        import httpx

        async with httpx.AsyncClient() as client:
            # Thryve sandbox API — endpoint and auth TBD at hackathon
            response = await client.get(
                f"https://api.thryve.health/v5/users/{thryve_user_id}/daily-dynamic",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "X-App-Id": app_id,
                },
                params={"startDate": "2026-04-03", "endDate": "2026-04-10"},
                timeout=10.0,
            )
            response.raise_for_status()
            raw_data = response.json()

            # TODO: Transform Thryve raw response into our contract format
            # This will be implemented once we have the actual API docs
            # For now, return the raw data and let the calling code handle it
            return raw_data
    except Exception as e:
        logger.warning(f"Thryve API error: {e}, falling back to hardcoded data")
        return None


def get_wearable_hardcoded(patient_id: str) -> dict:
    """Get hardcoded wearable data for a patient."""
    return HARDCODED_WEARABLES.get(patient_id, HARDCODED_WEARABLES["sophie_martin"])


async def get_wearable_data(patient_id: str, thryve_user_id: str) -> dict:
    """Get wearable data from Thryve API, falling back to hardcoded data."""
    thryve_data = await fetch_wearable_thryve(thryve_user_id)
    if thryve_data:
        return thryve_data
    return get_wearable_hardcoded(patient_id)
