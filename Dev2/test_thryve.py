"""
Dev2 — Test Thryve API for wearable health data.

Usage:
    export THRYVE_API_KEY=your_key_here
    export THRYVE_APP_ID=your_app_id_here
    python Dev2/test_thryve.py

Docs: https://docs.thryve.health/further-resources/v5-api-reference

Sandbox: ~10 user profiles with 1+ year of real data.
Our patient mapping:
    sophie_martin  → sandbox_user_03
    marc_dubois    → sandbox_user_07
    lea_chen       → sandbox_user_11
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta

from dotenv import load_dotenv

# Load .env from agent/ directory
load_dotenv(Path(__file__).resolve().parent.parent / "agent" / ".env")

# Check env vars
missing = []
if not os.environ.get("THRYVE_API_KEY") or os.environ.get("THRYVE_API_KEY") == "your_thryve_api_key_here":
    missing.append("THRYVE_API_KEY")
if not os.environ.get("THRYVE_APP_ID") or os.environ.get("THRYVE_APP_ID") == "your_thryve_app_id_here":
    missing.append("THRYVE_APP_ID")

if missing:
    print(f"ERROR: Missing env vars: {', '.join(missing)}")
    print("  Add them to agent/.env")
    sys.exit(1)

try:
    import httpx
except ImportError:
    print("Installing httpx...")
    os.system(f"{sys.executable} -m pip install httpx")
    import httpx


THRYVE_API_KEY = os.environ["THRYVE_API_KEY"]
THRYVE_APP_ID = os.environ["THRYVE_APP_ID"]
THRYVE_BASE_URL = "https://api.und-gesund.de/v5"

# Biomarker IDs we care about
BIOMARKERS = {
    1000: "Steps",
    2000: "SleepDuration (minutes)",
    2001: "SleepInBedDuration (minutes)",
    3000: "HeartRate (avg bpm)",
    3001: "HeartRateResting (avg bpm)",
    1010: "BurnedCalories (kcal)",
    1100: "ActivityDuration (minutes)",
}

# Data source mapping
DATA_SOURCES = {
    1: "Fitbit", 2: "Garmin", 3: "Polar", 5: "Apple Health",
    6: "Samsung Health", 8: "Withings", 18: "Oura", 42: "Whoop",
}

# Sandbox user IDs to test
SANDBOX_USERS = ["sandbox_user_03", "sandbox_user_07", "sandbox_user_11"]


def get_daily_data(user_id: str, start_date: str, end_date: str, biomarker_ids: list[int]):
    """Fetch daily data from Thryve API."""
    url = f"{THRYVE_BASE_URL}/dailyDynamicValues"
    headers = {
        "Authorization": f"Bearer {THRYVE_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "authenticationToken": THRYVE_API_KEY,
        "appID": THRYVE_APP_ID,
        "userID": user_id,
        "startDate": start_date,
        "endDate": end_date,
        "dataSources": list(BIOMARKERS.keys()),
    }

    print(f"\n  Request: POST {url}")
    print(f"  User: {user_id}")
    print(f"  Period: {start_date} → {end_date}")
    print(f"  Biomarkers: {biomarker_ids}")

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, json=payload, headers=headers)
            print(f"  Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"  Response keys: {list(data.keys()) if isinstance(data, dict) else 'list'}")
                return data
            else:
                print(f"  Error body: {response.text[:300]}")
                return None
    except Exception as e:
        print(f"  ERROR: {e}")
        return None


def test_user(user_id: str):
    """Test data retrieval for one sandbox user."""
    today = datetime.now()
    start_7d = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    start_30d = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    end = today.strftime("%Y-%m-%d")

    print(f"\n{'='*60}")
    print(f"  Testing user: {user_id}")
    print(f"{'='*60}")

    # Last 7 days
    print("\n  --- Last 7 days ---")
    data_7d = get_daily_data(user_id, start_7d, end, list(BIOMARKERS.keys()))

    # Last 30 days (for baseline)
    print("\n  --- Last 30 days (baseline) ---")
    data_30d = get_daily_data(user_id, start_30d, end, list(BIOMARKERS.keys()))

    if data_7d:
        print(f"\n  7-day data sample (first 500 chars):")
        print(f"  {json.dumps(data_7d, indent=2)[:500]}")

    return {"user_id": user_id, "7d": data_7d is not None, "30d": data_30d is not None}


def main():
    print("=" * 60)
    print("  THRYVE API TEST — Wearable Health Data")
    print("=" * 60)
    print(f"\n  API Key: {THRYVE_API_KEY[:8]}...")
    print(f"  App ID:  {THRYVE_APP_ID}")
    print(f"  Base URL: {THRYVE_BASE_URL}")

    results = []
    for user_id in SANDBOX_USERS:
        result = test_user(user_id)
        results.append(result)

    # Summary
    print("\n\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    success = sum(1 for r in results if r["7d"] and r["30d"])
    print(f"  Users with data: {success}/{len(results)}")

    if success >= 2:
        print("\n  VERDICT: Thryve API works! Integrate into tools.py.")
    elif success >= 1:
        print("\n  VERDICT: Partial data. Use with mock fallback.")
    else:
        print("\n  VERDICT: No data retrieved. Keep mock data for demo.")


if __name__ == "__main__":
    main()
