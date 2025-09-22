from app.core.data_config.intakesections.ID_FACR import ID_FACR
from app.core.data_config.intakesections.UT_CCCI import UT_CCCI

DEFAULT_INTAKE_TYPE = "ID-FACR"

SUPPORTED_INTAKE_NAMES = ["ID-FACR", "UT-CCCI"]

INTAKE_SECTIONS_MAPPING = {"ID-FACR": ID_FACR, "UT-CCCI": UT_CCCI}
