from datetime import date
from typing import Optional

from pydantic import BaseModel


class FullNameModel(BaseModel):
    given_names: str
    middle_names: Optional[str] = ""
    surname: str
    name_suffix: Optional[str] = ""

    def formatted_full_name(self) -> str:
        """
        Format the full name as a string with proper spacing.
        Includes middle names and suffixes only if they exist.
        """
        parts = [self.given_names]

        if self.middle_names:
            parts.append(self.middle_names)

        parts.append(self.surname)

        if self.name_suffix:
            parts.append(self.name_suffix)

        return " ".join(parts)


class CaseWorkerDataRecord(BaseModel):
    external_staff_id: str
    pseudonymized_staff_id: str
    email: str
    full_name: FullNameModel
    external_client_ids: list[str]
    state_code: str
    locations: Optional[list[str]] = None


class ClientDataRecord(BaseModel):
    external_client_id: str
    pseudonymized_client_id: str
    full_name: FullNameModel
    birthdate: date
    state_code: str
    location: Optional[list[str]] = None
