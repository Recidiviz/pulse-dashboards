from pathlib import Path
from typing import List
from uuid import UUID

import yaml

from app.core.config import settings


def get_eval_intake_ids() -> List[UUID]:
    path = Path(__file__).parent / "eval_config.yaml"
    data = yaml.safe_load(path.read_text())
    raw = data["eval_intake_ids"].get(settings.ENV_NAME) or []
    return [UUID(str(r)) for r in raw]
