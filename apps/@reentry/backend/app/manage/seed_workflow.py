"""
--- Not working ATM
Script to seed a complete workflow with proper dependencies:
1. Intakes in different stages
2. Assessments only for completed intakes
3. Plans only for completed assessments

This ensures the proper workflow dependency chain is maintained.
"""

import json
from pathlib import Path


def load_client_data_from_file(client_pseudo_id: str, data_type: str) -> dict | None:
    """Load client data from JSON file in seed_workflow folder"""
    data_dir = Path(__file__).parent.parent.parent / "data" / "seed_workflow"
    file_path = data_dir / f"{client_pseudo_id}_{data_type}.json"

    if not file_path.exists():
        print(f"Data file not found: {file_path}")
        return None

    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading data from {file_path}: {e}")
        return None


def get_available_client_data_files() -> list[str]:
    """Get list of client IDs that have data files in seed_workflow folder"""
    data_dir = Path(__file__).parent.parent.parent / "data" / "seed_workflow"
    if not data_dir.exists():
        return []

    client_pseudo_ids = set()
    for file_path in data_dir.glob("*_assessment.json"):
        client_pseudo_id = file_path.stem.replace("_assessment", "")
        client_pseudo_ids.add(client_pseudo_id)

    for file_path in data_dir.glob("*_plan.json"):
        client_pseudo_id = file_path.stem.replace("_plan", "")
        client_pseudo_ids.add(client_pseudo_id)

    return list(client_pseudo_ids)
