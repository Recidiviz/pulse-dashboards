import json
import logging
from datetime import date
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.intake.auth_client_user import validate_non_pseudo_id, validate_pseudo_dob
from app.core.db import get_session
from app.crud.intake import create_intake, get_intake_by_client_id
from app.models.intake import ClientAddress, IntakeType
from app.utils.action_plan_types import TranscriptionMessage
from app.utils.intake.constants import IntakeStatus
from app.utils.transcription.post_processing import (
    DeepgramTranscriptionInput,
    TranscriptionOutput,
    TranscriptionProcessor,
)

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


# todo: provisional endpoint to generate action plan from transcription
@router.post(
    "/{client_id}/transcription-generate-action-plan",
    summary="Submit json transcription to generate action plan",
    description="Submit a JSON transcription to generate an action plan for the client's intake.",
    tags=["Intake assessment"],
)
async def transcription_generate_action_plan(
    request: Request,
    messages: List[TranscriptionMessage],
    client_id: str,
    session: AsyncSession = Depends(get_session),
):
    print("Transcription generate action plan called", len(messages))

    # getting intake
    intake = await get_intake_by_client_id(session, client_id)

    if not intake:
        intake = await create_intake(session, client_id, IntakeType.TRANSCRIPTION)

    if intake.intake_type != IntakeType.TRANSCRIPTION:
        raise HTTPException(
            status_code=400,
            detail="Intake type must be TRANSCRIPTION for this endpoint",
        )
    # save the intake messages to the database into the intake table
    intake.transcription_messages = [msg.dict() for msg in messages]
    # using a fake address
    new_address = ClientAddress(
        intake_id=intake.id,
        city="New york",
        state="NY",
    )
    session.add(new_address)
    session.add(intake)

    await intake.update_status(session, IntakeStatus.COMPLETED)
    await session.commit()
    await session.refresh(intake)

    return {
        "intake_completed": intake.status == IntakeStatus.COMPLETED,
    }


@router.get(
    "/transcription-processor",
    summary="transcription-processor",
    description="transcription-processor",
    tags=["Intake assessment"],
)
async def transcription_processor(
    request: Request, session: AsyncSession = Depends(get_session)
):
    # TODO: Remove this endpoint once the transcription processor is fully integrated, this is just for testing purposes
    async def _load_transcription():
        base_dir = Path(__file__).parent
        input_file = base_dir / "../utils/transcription/transcription_input.json"
        if not input_file.exists():
            raise FileNotFoundError(f"Input file not found: {input_file}")

        try:
            with open(input_file, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            transcription = DeepgramTranscriptionInput(**raw_data)
            return transcription
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format in {input_file}: {e}")
        except Exception as e:
            raise ValueError(f"Invalid transcription data: {e}")

    async def _save_output(output: TranscriptionOutput) -> None:
        try:
            base_dir = Path(__file__).parent
            output_file = base_dir / "../utils/transcription/transcription_output.json"

            # Ensure output directory exists
            output_file.parent.mkdir(parents=True, exist_ok=True)

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(output.dict(), f, indent=2, ensure_ascii=False)

            logger.debug(f"Output JSON saved: {output_file}")

        except IOError as error:
            raise (IOError(f"Failed to save output file: {error}"))

    try:
        # todo: get the transcription data from the url, for now using a json file for input data
        transcription = await _load_transcription()

        processor = TranscriptionProcessor(
            transcription=transcription, diarization_service="deepgram"
        )
        transcription_result = await processor.convert_transcript_to_conversation()

        # todo: saving the output in a database, for now saving it in a json file
        await _save_output(transcription_result)
        return {"message": "Transcription post processing completed successfully."}
    except Exception as e:
        logger.error(f"Error fetching client intake: {e}")
        raise HTTPException(status_code=500, detail=str(e))
