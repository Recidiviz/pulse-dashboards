import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.auth.intake.auth_client_user import (
    validate_non_pseudo_id,
    validate_pseudo_dob,
    validate_state_doc_id,
)
from app.core.db import AsyncSession, get_session

logger = logging.getLogger(__name__)

router = APIRouter()


class VerifyClientResponse(BaseModel):
    status: bool
    access_token: Optional[str] = None
    token_type: str = "bearer"
    message: Optional[str] = None
    client_pseudo_id: str


class VerifyPseudoDOBRequest(BaseModel):
    last_name: str
    date_of_birth: date


class VerifyNonPseudoId(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    recaptchaToken: Optional[str] = None


class VerifyStateDocId(BaseModel):
    doc_id: str
    state_code: str


@router.post(
    "/{pseudonymized_id}",
    response_model=VerifyClientResponse,
    summary="Verify date of birth with pseudonymized ID and last name",
    description="Validates client's DOB and last name against pseudonymized ID records and issues JWT token",
    tags=["Intake assessment"],
)
async def verify_pseudo_date_of_birth(
    request: Request,
    data: VerifyPseudoDOBRequest,
    pseudonymized_id: str,
    session: AsyncSession = Depends(get_session),
):
    try:
        redis_client = request.app.state.redis_client

        result = await validate_pseudo_dob(
            request=request,
            pseudonymized_id=pseudonymized_id,
            date_of_birth=data.date_of_birth,
            session=session,
            redis_client=redis_client,
            last_name=data.last_name,
        )

        if not result.success:
            raise HTTPException(status_code=400, detail=result.error_message)

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
        logger.error(f"Error verifying pseudo date of birth: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/verify/non-pseudo-id",
    response_model=VerifyClientResponse,
    summary="Verify date of birth,first name and last name",
    description="Validates client's data  against BigQuery records and issues JWT token",
    tags=["Intake assessment"],
)
async def verify_non_pseudonymized_id(
    request: Request,
    data: VerifyNonPseudoId,
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

        result = await validate_non_pseudo_id(
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


@router.post(
    "/verify/state-doc-id",
    response_model=VerifyClientResponse,
    summary="Verify DOC ID and state code",
    description="Validates client's DOC ID and state code against BigQuery records and issues JWT token",
    tags=["Intake assessment"],
)
async def verify_state_doc_id(
    request: Request,
    data: VerifyStateDocId,
    session: AsyncSession = Depends(get_session),
):
    try:
        result = await validate_state_doc_id(
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
