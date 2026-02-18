from uuid import UUID

from app.core.db import AsyncSession
from app.crud.recording_session import get_recording_session_by_id
from app.models.recording import RecordingStatus
from app.utils.transcription.post_processing import TranscriptionOutput


async def get_transcription_messages_from_gcp(
    recording_session_id: UUID, session: AsyncSession
):
    recording_session = await get_recording_session_by_id(session, recording_session_id)
    if recording_session is None:
        raise ValueError("Recording session not found")

    intake = recording_session.intake
    if intake.client_pseudo_id != recording_session.client_pseudo_id:
        raise ValueError("Client ID mismatch between intake and recording session")

    if recording_session.status != RecordingStatus.COMPLETED:
        raise ValueError("Recording incomplete")

    # Retrieve the transcription from storage using the model method
    try:
        transcription_data = await recording_session.get_transcription_from_gcs(
            is_processed=True
        )
    except FileNotFoundError as e:
        raise ValueError(f"Transcription not found: {str(e)}") from e
    except Exception as e:
        raise ValueError(f"Failed to retrieve transcription: {str(e)}") from e

    transcription_output = TranscriptionOutput(
        conversation=transcription_data.get("conversation", []),
        metadata=transcription_data.get("metadata", {}),
    )

    conversation_dicts = [
        turn.model_dump() for turn in transcription_output.conversation
    ]
    return conversation_dicts
