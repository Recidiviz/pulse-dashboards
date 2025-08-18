import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.intake.auth_client_user import validate_non_pseudo_id, validate_pseudo_dob
from app.core.db import get_session

logger = logging.getLogger(__name__)

router = APIRouter()


class VerifyDOBResponse(BaseModel):
    status: bool
    access_token: Optional[str] = None
    token_type: str = "bearer"
    message: Optional[str] = None


class VerifyPseudoDOBRequest(BaseModel):
    last_name: str
    date_of_birth: date


class VerifyNonPseudoId(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    recaptchaToken: Optional[str] = None


@router.post(
    "/{pseudonymized_id}",
    response_model=VerifyDOBResponse,
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

        return VerifyDOBResponse(
            status=True,
            access_token=result.token_data["token"],
            token_type="bearer",
            message="Verification successful",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying pseudo date of birth: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/verify/non-pseudo-id",
    response_model=VerifyDOBResponse,
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

        return VerifyDOBResponse(
            status=True,
            access_token=result.token_data["token"],
            token_type="bearer",
            message="Verification successful",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying non-pseudonymized ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))
