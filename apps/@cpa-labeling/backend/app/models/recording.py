"""Read-only model for recording session data."""

from typing import Optional
from uuid import UUID

from sqlmodel import Field, SQLModel


class RecordingSession(SQLModel, table=True):
    """Read-only model for recording_session table.

    Only includes fields needed to locate the GCS transcript.
    """

    __tablename__ = "recording_session"

    id: UUID = Field(primary_key=True)
    intake_id: UUID = Field(foreign_key="intake.id")
    gcs_bucket_name: Optional[str] = None
    status: Optional[str] = None
