import json
from uuid import UUID

from app.core.db import AsyncSession
from app.crud.recording_session import get_recording_session_by_id
from app.services.recording_service import RecordingService
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

    # Try to retrieve the transcription from storage
    service = RecordingService(recording_session.gcs_bucket_name)
    try:
        data = await service.storage.download(
            bucket=recording_session.gcs_bucket_name,
            object_name=f"transcriptions/{recording_session_id}_processed.json",
        )
    except Exception as e:
        raise ValueError(f"Failed to download transcription file: {str(e)}")
    finally:
        await service.close()

    # Try to parse the JSON
    try:
        transcription_data = json.loads(data)
    except json.JSONDecodeError:
        raise ValueError("Invalid transcription file format")

    transcription_output = TranscriptionOutput(
        conversation=transcription_data.get("conversation", []),
        metadata=transcription_data.get("metadata", {}),
    )

    conversation_dicts = [
        turn.model_dump() for turn in transcription_output.conversation
    ]
    return conversation_dicts
