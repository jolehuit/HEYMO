"""
Dev2 — Test Linkup API for reimbursement data.

Usage:
    export LINKUP_API_KEY=bad1d093-fcd9-4edd-8195-36a4d9848ea2
    python Dev2/test_linkup.py

Expected: The API should return useful reimbursement rates for French medical procedures.
If it doesn't, we keep the mock data and mention Linkup as a production data source in the pitch.
"""

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load .env from agent/ directory
load_dotenv(Path(__file__).resolve().parent.parent / "agent" / ".env")

# Ensure LINKUP_API_KEY is set
if not os.environ.get("LINKUP_API_KEY"):
    print("ERROR: LINKUP_API_KEY not set in agent/.env or environment.")
    print("  Add LINKUP_API_KEY=xxx to agent/.env")
    sys.exit(1)

from linkup import LinkupClient


PROCEDURES_TO_TEST = [
    ("consultation spécialiste", "specialist_consultation"),
    ("consultation médecin généraliste", "general_consultation"),
    ("séance de kinésithérapie", "physiotherapy"),
    ("IRM", "mri"),
    ("échographie", "ultrasound"),
    ("prise de sang bilan standard", "blood_test"),
    ("téléconsultation", "teleconsultation"),
]


async def test_single_query(client: LinkupClient, procedure_fr: str, procedure_key: str):
    """Test a single Linkup search for a procedure."""
    query = f"taux remboursement sécurité sociale {procedure_fr} France 2025 2026"
    print(f"\n{'='*60}")
    print(f"  Procedure: {procedure_fr} ({procedure_key})")
    print(f"  Query:     {query}")
    print(f"{'='*60}")

    try:
        result = await client.async_search(
            query=query,
            depth="standard",
            output_type="sourcedAnswer",
            timeout=15.0,
        )
        print(f"\n  Answer:\n    {result.answer[:500]}")
        print(f"\n  Sources ({len(result.sources)}):")
        for s in result.sources:
            print(f"    - {s.name}: {s.url}")

        # Check if answer contains useful data (numbers, percentages)
        has_numbers = any(c.isdigit() for c in result.answer)
        has_percent = "%" in result.answer
        has_euro = "€" in result.answer or "euro" in result.answer.lower()

        quality = "GOOD" if (has_numbers and (has_percent or has_euro)) else "WEAK"
        print(f"\n  Data quality: {quality}")
        return {"procedure": procedure_key, "quality": quality, "answer": result.answer}

    except Exception as e:
        print(f"\n  ERROR: {e}")
        return {"procedure": procedure_key, "quality": "FAIL", "error": str(e)}


async def main():
    print("=" * 60)
    print("  LINKUP API TEST — Reimbursement Data")
    print("=" * 60)

    client = LinkupClient()
    results = []

    for proc_fr, proc_key in PROCEDURES_TO_TEST:
        result = await test_single_query(client, proc_fr, proc_key)
        results.append(result)

    # Summary
    print("\n\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    good = sum(1 for r in results if r["quality"] == "GOOD")
    weak = sum(1 for r in results if r["quality"] == "WEAK")
    fail = sum(1 for r in results if r["quality"] == "FAIL")
    print(f"  GOOD: {good}/{len(results)}")
    print(f"  WEAK: {weak}/{len(results)}")
    print(f"  FAIL: {fail}/{len(results)}")

    if good >= 3:
        print("\n  VERDICT: Linkup is usable! Integrate it into tools.py.")
    elif good >= 1:
        print("\n  VERDICT: Linkup is partially usable. Use it with mock fallback.")
    else:
        print("\n  VERDICT: Linkup not usable. Keep mock data, mention in pitch.")


if __name__ == "__main__":
    asyncio.run(main())
