"""
Request and response models for recording session endpoints.
"""

import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.recording import RecordingStatus
from app.routes.base import ORMResponse

from .execution_router import ExecutionResponse


class RecordingSessionResponse(ORMResponse):
    client_pseudo_id: str
    intake_id: UUID
    audio_chunks_url: Optional[str] = None
    audio_file_url: Optional[str] = None
    status: RecordingStatus
    gcs_bucket_name: Optional[str] = None
    gcs_chunks_folder: Optional[str] = None
    gcs_final_file_path: Optional[str] = None
    chunk_count: int
    duration: Optional[int] = 0
    transcription_approved: bool = False
    execution_id: uuid.UUID | None = None
    execution: ExecutionResponse | None = None


class CreateRecordingSessionRequest(BaseModel):
    intake_id: UUID


class UpdateRecordingSessionStatusRequest(BaseModel):
    status: RecordingStatus
    audio_chunks_url: Optional[str] = None
    audio_file_url: Optional[str] = None


class UploadChunkRequest(BaseModel):
    timestamp: int  # Unix timestamp in milliseconds
    chunk_index: int
    chunk_data: str  # Base64 encoded audio data
    mime_type: str
    has_header: bool = False
    chunk_duration: int


class UploadChunkResponse(BaseModel):
    success: bool
    chunk_index: int
    timestamp: int
    message: str


class FinalizeRecordingRequest(BaseModel):
    total_chunks: int


class FinalizeRecordingResponse(BaseModel):
    execution_id: str


class SignedUrlResponse(BaseModel):
    signed_url: str
    expires_in_seconds: int


class RecordingSessionStatusResponse(BaseModel):
    id: str
    status: RecordingStatus
    chunk_count: int
    duration: Optional[int] = 0
    processing_progress: Optional[float] = None
    error_message: Optional[str] = None
    updated_at: datetime
    gcs_final_file_path: Optional[str] = None
    transcription_approved: bool = False


class UploadAudioFileResponse(BaseModel):
    success: bool
    gcs_file_path: str
    execution_id: str
    message: str
