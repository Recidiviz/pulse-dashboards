import logging
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, Optional, Tuple, Union

import jwt
from fastapi import HTTPException

from app.core.config import settings
from app.services.client_data.types import ClientDataRecord, FullNameModel

logger = logging.getLogger(__name__)


def create_access_token(
    client_pseudo_id: str, client_name: Optional[Union[str, FullNameModel]] = None
) -> str:
    """
    Create a JWT access token with client ID as the subject.
    """
    login_time = datetime.utcnow()
    payload = {
        "sub": client_pseudo_id,
        "iat": login_time,
        "token_type": "client",
        "login_timestamp": login_time.timestamp(),
    }

    token = jwt.encode(
        payload, key=settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )

    return token


def decode_jwt_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        client_pseudo_id = payload.get("sub")
        if not client_pseudo_id:
            raise HTTPException(status_code=401, detail="Invalid token.")

        token_type = payload.get("token_type")
        if token_type != "client":
            raise HTTPException(status_code=401, detail="Invalid token.")

        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError as e:
        logger.error(e)
        raise HTTPException(status_code=401, detail="Invalid token")


def validate_credentials_and_dob(
    record: Optional[ClientDataRecord],
    date_of_birth: date,
    last_name: Optional[str] = None,
    validate_name: bool = False,
) -> Tuple[bool, Optional[ClientDataRecord]]:
    if not record:
        return False, None

    date_matches = date_of_birth == record.birthdate

    if not date_matches:
        return False, None

    if validate_name:
        if not last_name or not last_name.strip():
            return False, None

        if (
            not record.full_name
            or not record.full_name.surname
            or not record.full_name.surname.strip()
        ):
            return False, None  # Fail if record doesn't have a last name

        provided_last_name = last_name.strip().lower()
        record_last_name = record.full_name.surname.strip().lower()

        last_name_matches = provided_last_name == record_last_name
        return last_name_matches, record if last_name_matches else None

    return True, record


def create_client_response(
    client_pseudo_id: str, full_name: FullNameModel
) -> Dict[str, Any]:
    """
    Create a standard client response with token.
    """
    token = create_access_token(client_pseudo_id, full_name)
    formatted_name = full_name.formatted_full_name()

    return {
        "client_pseudo_id": str(client_pseudo_id),
        "client_name": formatted_name,
        "token": token,
        "full_name": full_name.dict(),
    }


@dataclass
class ValidationResult:
    error_message: Optional[str] = None
    token_data: Optional[Dict[str, Any]] = None
    client_pseudo_id: Optional[str] = None
    user_facing: bool = True

    @property
    def success(self) -> bool:
        """Validation succeeded if there's no error message."""
        return self.error_message is None

    @classmethod
    def success_result(
        cls, token_data: Dict[str, Any], client_pseudo_id: str
    ) -> "ValidationResult":
        return cls(token_data=token_data, client_pseudo_id=client_pseudo_id)

    @classmethod
    def error_result(
        cls, error_message: str, user_facing: bool = True
    ) -> "ValidationResult":
        return cls(error_message=error_message, user_facing=user_facing)
