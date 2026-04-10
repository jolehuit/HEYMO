"""
Function tools — stubs with mock data (BOILERPLATE)

Each function has:
1. A clear interface (what it takes, what it returns)
2. A mock implementation that returns valid data
3. A TODO marker for the dev who owns the real implementation

The mock data matches the contracts in frontend/lib/types.ts.

Grep tasks:  grep -n "TODO" tools.py
"""

import json
import os
import logging
from pathlib import Path

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


async def get_reimbursement_info(procedure: str, patient: dict) -> dict:
    """Get reimbursement info for a procedure.

    TODO(Dev2): Replace this mock with real Linkup API call.
    """
    # --- STUB: returns mock data ---
    base = MOCK_REIMBURSEMENTS.get(procedure, MOCK_REIMBURSEMENTS["specialist_consultation"])
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


# ==========================================================================
# WEARABLE DATA (Dev 2)
#
# Interface: get_wearable_data(patient_id, thryve_user_id) → dict
# Returns:   { source, period, heart_rate{...}, sleep{...}, activity{...},
#              risk_patterns[] }
#
# TODO(Dev2): Replace mock with Thryve API call.
# Thryve credentials and API docs arrive Saturday morning at the hackathon.
# When you get them:
#   1. Read the Thryve API docs for the correct endpoint + auth
#   2. Fetch heart_rate, sleep, activity data for the past 7 days
#   3. Transform the Thryve response into the format below
#   4. Compute trends by comparing recent vs baseline
#   5. If the API doesn't work → keep the mock, demo is identical
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


async def get_wearable_data(patient_id: str, thryve_user_id: str) -> dict:
    """Get wearable data for a patient.

    TODO(Dev2): Replace this mock with real Thryve API call.
    """
    # --- STUB: returns mock data ---
    return MOCK_WEARABLES.get(patient_id, MOCK_WEARABLES["sophie_martin"])
