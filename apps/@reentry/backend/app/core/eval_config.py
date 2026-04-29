from dataclasses import dataclass
from pathlib import Path
from typing import List
from uuid import UUID

import yaml

from app.core.config import settings


@dataclass
class IntakeGroup:
    name: str
    ids: list[UUID]


def _get_eval_ids(yaml_key: str) -> List[UUID]:
    path = Path(__file__).parent / "eval_config.yaml"
    data = yaml.safe_load(path.read_text())
    raw = data[yaml_key].get(settings.ENV_NAME) or []
    return [UUID(str(r)) for r in raw]


def get_eval_summary_intake_ids() -> List[UUID]:
    return _get_eval_ids("eval_intake_ids")


def get_eval_action_plan_intake_ids() -> List[UUID]:
    return _get_eval_ids("eval_action_plan_intake_ids")


def get_eval_intake_groups() -> list[IntakeGroup]:
    path = Path(__file__).parent / "eval_config.yaml"
    data = yaml.safe_load(path.read_text())
    raw = data.get("eval_intake_groups", {}).get(settings.ENV_NAME) or []
    return [
        IntakeGroup(name=g["name"], ids=[UUID(str(i)) for i in g["ids"]]) for g in raw
    ]
