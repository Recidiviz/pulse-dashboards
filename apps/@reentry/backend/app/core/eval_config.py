from pathlib import Path
from typing import List
from uuid import UUID

import yaml

from app.core.config import settings


def _get_eval_ids(yaml_key: str) -> List[UUID]:
    path = Path(__file__).parent / "eval_config.yaml"
    data = yaml.safe_load(path.read_text())
    raw = data[yaml_key].get(settings.ENV_NAME) or []
    return [UUID(str(r)) for r in raw]


def get_eval_summary_intake_ids() -> List[UUID]:
    return _get_eval_ids("eval_intake_ids")


def get_eval_action_plan_intake_ids() -> List[UUID]:
    return _get_eval_ids("eval_action_plan_intake_ids")
