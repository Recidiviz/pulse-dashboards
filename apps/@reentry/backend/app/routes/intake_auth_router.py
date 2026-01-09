import structlog
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.auth.intake.auth_client_user import (
    validate_dob_fullname,
    validate_dob_urltoken,
    validate_state_docid,
)
from app.core.db import AsyncSession, get_session

logger = structlog.get_logger(__name__)

router = APIRouter()


class VerifyClientResponse(BaseModel):
    status: bool
    access_token: Optional[str] = None
    token_type: str = "bearer"
    message: Optional[str] = None
    client_pseudo_id: str


# ---------- Dob + token -----------
class VerifyDobUrlTokenRequest(BaseModel):
    token_from_url: str
    date_of_birth: date


@router.post(
    "/dob+urltoken",
    response_model=VerifyClientResponse,
    summary="Verify date of birth and issue JWT token",
    description="Validates the client's date of birth against records and issues JWT token",
    tags=["Client side intake assessment - Auth"],
)
async def verify_date_of_birth(
    request: Request,
    data: VerifyDobUrlTokenRequest,
    session=Depends(get_session),
):
    try:
        redis_client = request.app.state.redis_client

        result = await validate_dob_urltoken(
            request, data.token_from_url, data.date_of_birth, session, redis_client
        )

        if not result.token_data or not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        return VerifyClientResponse(
            status=True,
            access_token=result.token_data["token"],
            token_type="bearer",
            message="Date of birth verified successfully",
            client_pseudo_id=result.client_pseudo_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying date of birth: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------- Dob + FullName -------------------
class VerifyDobFullnameRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    recaptchaToken: Optional[str] = None


@router.post(
    "/dob+fullname",
    response_model=VerifyClientResponse,
    summary="Verify date of birth, first name and last name",
    description="Validates client's data  against BigQuery records and issues JWT token",
    tags=["Client side intake assessment - Auth"],
)
async def verify_dob_fullname(
    request: Request,
    data: VerifyDobFullnameRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        # Pending to define if reCAPTCHA is needed
        # # validate recaptcha
        # if not data.recaptchaToken:
        #     raise HTTPException(status_code=400, detail="Recaptcha token is required")
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(
        #         "https://www.google.com/recaptcha/api/siteverify",
        #         data={
        #             "secret": settings.RECAPTCHA_SECRET_KEY,
        #             "response": data.recaptchaToken,
        #         },
        #     )
        # result = response.json()
        # logger.info(f"reCAPTCHA validation result: {result}")
        # if not result.get("success"):
        #     raise HTTPException(status_code=400, detail="Invalid reCAPTCHA token")

        result = await validate_dob_fullname(
            request=request,
            date_of_birth=data.date_of_birth,
            session=session,
            first_name=data.first_name,
            last_name=data.last_name,
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

        logger.info(f"Verification successful for {result}")

        return VerifyClientResponse(
            status=True,
            access_token=result.token_data["token"],
            token_type="bearer",
            message="Verification successful",
            client_pseudo_id=result.client_pseudo_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying non-pseudonymized ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --------- State + Doc Id ------------
class VerifyStateDocIdRequest(BaseModel):
    doc_id: str
    state_code: str


@router.post(
    "/state+docid",
    response_model=VerifyClientResponse,
    summary="Verify DOC ID and state code",
    description="Validates client's DOC ID and state code against BigQuery records and issues JWT token",
    tags=["Client side intake assessment - Auth"],
)
async def verify_state_doc_id(
    request: Request,
    data: VerifyStateDocIdRequest,
    session: AsyncSession = Depends(get_session),
):
    try:
        result = await validate_state_docid(
            request=request,
            doc_id=data.doc_id,
            state_code=data.state_code,
            session=session,
        )

        if not result.success:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": result.error_message,
                    "user_facing": result.user_facing,
                },
            )

        logger.info(f"Verification successful for {result}")

        return VerifyClientResponse(
            status=True,
            access_token=result.token_data["token"],
            token_type="bearer",
            message="Verification successful",
            client_pseudo_id=result.client_pseudo_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying state DOC ID: {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": str(e), "user_facing": False},
        )
