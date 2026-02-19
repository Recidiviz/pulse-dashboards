from datetime import datetime, timezone
from typing import Dict, List, Optional, Union

import structlog
from pydantic import BaseModel

from app.core.data_config.assessment_configs.assessment_config import ModelConfig
from app.models.recording import RecordingSession

logger = structlog.get_logger(__name__)


### DEEPGRAM INPUT DATA MODELS ###


class DeepgramWordInput(BaseModel):
    word: str
    start: float
    end: float
    confidence: float
    speaker: int
    speaker_confidence: float
    punctuated_word: str


class DeepgramParagraphs(BaseModel):
    transcript: str
    paragraphs: List[Dict]


class DeepgramAlternativeInput(BaseModel):
    transcript: str
    confidence: float
    words: List[DeepgramWordInput]
    paragraphs: Optional[DeepgramParagraphs] = None


class DeepgramChannelInput(BaseModel):
    alternatives: List[DeepgramAlternativeInput]


class DeepgramResultInput(BaseModel):
    channels: List[DeepgramChannelInput]


class DeepgramMetadataInput(BaseModel):
    transaction_key: str
    request_id: str
    sha256: str
    created: str
    duration: float
    channels: int
    models: List[str]
    model_info: Dict


class DeepgramTranscriptionInput(BaseModel):
    metadata: DeepgramMetadataInput
    results: DeepgramResultInput


class DeepgramTranscriptionOutput(BaseModel):
    metadata: DeepgramMetadataInput
    results: DeepgramResultInput


### GCP INPUT DATA MODELS ###


class GCPWordInput(BaseModel):
    startTime: str
    endTime: str
    word: str
    speakerTag: int
    confidence: Optional[float] = None


class GCPAlternativeInput(BaseModel):
    transcript: str
    confidence: float
    words: List[GCPWordInput]


class GCPResultInput(BaseModel):
    alternatives: List[GCPAlternativeInput]
    languageCode: str


class GCPTranscriptionInput(BaseModel):
    results: List[GCPResultInput]


### OUTPUT DATA MODELS ###


class ConversationTurn(BaseModel):
    id: str
    role: str
    content: str
    startTime: str
    endTime: str
    startTimeMs: int
    endTimeMs: int
    duration: str
    speakerTag: int
    wordCount: int


class SpeakerStats(BaseModel):
    turns: int
    duration: str


class OutputMetadata(BaseModel):
    totalDuration: str
    totalTurns: int
    speakers: Dict[str, SpeakerStats]
    averageConfidence: float
    language: str
    createdAt: str
    diarizationService: str


class TranscriptionOutput(BaseModel):
    metadata: OutputMetadata
    conversation: List[ConversationTurn]


class SpeakersClarification(BaseModel):
    """Model representing the clarification of speaker roles returned by LLM."""

    speaker_1: str
    speaker_2: str


class TranscriptionProcessor:
    """
    Processes transcription data from Deepgram or GCP and converts it into structured conversation format.
    """

    def __init__(
        self,
        transcription: Union[DeepgramTranscriptionInput, GCPTranscriptionInput],
        diarization_service: str,
        model_config: ModelConfig,
    ):
        self.transcription = transcription
        self.diarization_service = diarization_service.lower()
        self.model_config = model_config

        if self.diarization_service not in ["deepgram", "gcp"]:
            raise ValueError("diarization_service must be 'deepgram' or 'gcp'")

    async def convert_transcript_to_conversation(self) -> TranscriptionOutput:
        """
        Main method to convert transcription input to structured conversation output.
        """
        try:
            if self.diarization_service == "deepgram":
                return await self._process_deepgram()
            else:
                return await self._process_gcp()
        except Exception as e:
            raise ValueError(f"Failed to process transcription: {str(e)}")

    async def _process_deepgram(self) -> TranscriptionOutput:
        # Extract primary data from Deepgram format
        words, confidence, language = self._extract_deepgram_data(self.transcription)
        logger.debug(
            f"Deepgram transcription loaded: {len(words)} words, confidence: {confidence}, language: {language}"
        )

        # Process conversation turns from words
        conversation_turns = await self._create_deepgram_conversation_turns(words)

        # Generate metadata
        metadata = await self._create_deepgram_metadata(
            conversation_turns, confidence, language, self.diarization_service
        )

        return TranscriptionOutput(metadata=metadata, conversation=conversation_turns)

    async def _process_gcp(self) -> TranscriptionOutput:
        # Extract primary data from GCP format
        words, confidence, language = self._extract_gcp_data(self.transcription)
        logger.debug(
            f"GCP transcription loaded: {len(words)} words, confidence: {confidence}, language: {language}"
        )

        # Process conversation turns from words
        conversation_turns = await self._create_gcp_conversation_turns(words)

        # Generate metadata
        metadata = await self._create_gcp_metadata(
            conversation_turns, confidence, language, self.diarization_service
        )

        return TranscriptionOutput(metadata=metadata, conversation=conversation_turns)

    def _extract_deepgram_data(self, transcription: DeepgramTranscriptionInput):
        if (
            not transcription.results.channels
            or not transcription.results.channels[0].alternatives
        ):
            raise ValueError(
                "No transcription result or alternatives found in Deepgram data"
            )

        primary_data = transcription.results.channels[0].alternatives[0]
        language = "en_us"  # Default language since Deepgram doesn't always provide this explicitly

        return primary_data.words, primary_data.confidence, language

    def _extract_gcp_data(self, transcription: GCPTranscriptionInput):
        """Extract primary data from GCP transcription format."""
        if not transcription.results or not transcription.results[0].alternatives:
            raise ValueError(
                "No transcription result or alternatives found in GCP data"
            )

        primary_data = transcription.results[-1].alternatives[0]

        return (
            primary_data.words,
            primary_data.confidence,
            transcription.results[0].languageCode,
        )

    async def _create_deepgram_conversation_turns(
        self, words: List[DeepgramWordInput]
    ) -> List[ConversationTurn]:
        if not words:
            logger.warning("No words provided for conversation turn creation")
            return []

        grouped_turns = self._group_deepgram_words_by_speaker(words)
        conversation_turns = []

        for i, turn_data in enumerate(grouped_turns, 1):
            content = " ".join(turn_data["words"]).strip()

            if not content:
                logger.warning(
                    f"empty turn detected at index {i}, turn_data: {turn_data}"
                )

            turn_model = ConversationTurn(
                id=f"turn_{i}",
                role=f"speaker_{turn_data['speaker']}",
                content=content,
                startTime=f"{turn_data['start']:.3f}s",
                endTime=f"{turn_data['end']:.3f}s",
                startTimeMs=int(turn_data["start"] * 1000),
                endTimeMs=int(turn_data["end"] * 1000),
                duration=f"{turn_data['end'] - turn_data['start']:.1f}s",
                speakerTag=turn_data["speaker"],
                wordCount=len(turn_data["raw_words"]),
            )
            conversation_turns.append(turn_model)

        logger.debug(
            f"Created {len(conversation_turns)} conversation turns from {len(words)} words"
        )
        return conversation_turns

    async def _create_gcp_conversation_turns(
        self, words: List[GCPWordInput]
    ) -> List[ConversationTurn]:
        """Create conversation turns from GCP words."""
        if not words:
            logger.warning("No words provided for conversation turn creation")
            return []

        grouped_turns = self._group_gcp_words_by_speaker(words)
        conversation_turns = []

        for i, turn_data in enumerate(grouped_turns, 1):
            content = " ".join(turn_data["words"]).strip()

            if not content:
                logger.warning(
                    f"empty turn detected at index {i}, turn_data: {turn_data}"
                )

            turn_model = ConversationTurn(
                id=f"turn_{i}",
                role=f"speaker_{turn_data['speaker']}",
                content=content,
                startTime=turn_data["startTime"],
                endTime=turn_data["endTime"],
                startTimeMs=self._convert_to_milliseconds(turn_data["startTime"]),
                endTimeMs=self._convert_to_milliseconds(turn_data["endTime"]),
                duration=await self._calculate_gcp_duration(
                    turn_data["startTime"], turn_data["endTime"]
                ),
                speakerTag=turn_data["speaker"],
                wordCount=len(turn_data["words"]),
            )
            conversation_turns.append(turn_model)

        logger.debug(
            f"Created {len(conversation_turns)} conversation turns from {len(words)} words"
        )
        return conversation_turns

    def _group_deepgram_words_by_speaker(
        self, words: List[DeepgramWordInput]
    ) -> List[Dict]:
        """Group consecutive Deepgram words by the same speaker into turns."""
        grouped_turns = []
        current_turn = None

        for word in words:
            if not current_turn or current_turn["speaker"] != word.speaker:
                if current_turn:
                    grouped_turns.append(current_turn)

                current_turn = {
                    "speaker": word.speaker,
                    "words": [word.punctuated_word],
                    "raw_words": [word.word],
                    "start": word.start,
                    "end": word.end,
                }
            else:
                current_turn["words"].append(word.punctuated_word)
                current_turn["raw_words"].append(word.word)
                current_turn["end"] = word.end

        if current_turn:
            grouped_turns.append(current_turn)

        return grouped_turns

    def _group_gcp_words_by_speaker(self, words: List[GCPWordInput]) -> List[Dict]:
        """Group consecutive GCP words by the same speaker into turns."""
        grouped_turns = []
        current_turn = None

        for word in words:
            if not current_turn or current_turn["speaker"] != word.speakerTag:
                if current_turn:
                    grouped_turns.append(current_turn)

                current_turn = {
                    "speaker": word.speakerTag,
                    "words": [word.word],
                    "startTime": word.startTime,
                    "endTime": word.endTime,
                }
            else:
                current_turn["words"].append(word.word)
                current_turn["endTime"] = word.endTime

        if current_turn:
            grouped_turns.append(current_turn)

        return grouped_turns

    async def _create_deepgram_metadata(
        self,
        conversation: List[ConversationTurn],
        confidence: float,
        language: str,
        diarization_service: str,
    ) -> OutputMetadata:
        if not conversation:
            return OutputMetadata(
                totalDuration="0s",
                totalTurns=0,
                speakers={},
                averageConfidence=confidence,
                language=language,
                createdAt=datetime.now(timezone.utc).isoformat(),
                diarizationService=self.diarization_service,
            )

        total_duration = f"{self.transcription.metadata.duration:.1f}s"
        speaker_stats = self._calculate_speaker_stats(conversation)

        return OutputMetadata(
            totalDuration=total_duration,
            totalTurns=len(conversation),
            speakers=speaker_stats,
            averageConfidence=confidence,
            language=language,
            createdAt=datetime.now(timezone.utc).isoformat(),
            diarizationService=diarization_service,
        )

    async def _create_gcp_metadata(
        self,
        conversation: List[ConversationTurn],
        confidence: float,
        language: str,
        diarization_service: str,
    ) -> OutputMetadata:
        """Create comprehensive metadata for GCP conversation."""
        if not conversation:
            return OutputMetadata(
                totalDuration="0s",
                totalTurns=0,
                speakers={},
                averageConfidence=confidence,
                language=language,
                createdAt=datetime.now(timezone.utc).isoformat(),
                diarizationService=self.diarization_service,
            )

        total_duration_ms = max(turn.endTimeMs for turn in conversation)
        total_duration = f"{total_duration_ms / 1000:.1f}s"
        speaker_stats = self._calculate_speaker_stats(conversation)

        return OutputMetadata(
            totalDuration=total_duration,
            totalTurns=len(conversation),
            speakers=speaker_stats,
            averageConfidence=confidence,
            language=language.upper(),
            createdAt=datetime.now(timezone.utc).isoformat(),
            diarizationService=self.diarization_service,
        )

    def _calculate_speaker_stats(
        self, conversation: List[ConversationTurn]
    ) -> Dict[str, SpeakerStats]:
        """Calculate speaking statistics for each participant."""
        role_data = {}

        for turn in conversation:
            role = turn.role
            if role not in role_data:
                role_data[role] = {"turns": 0, "duration_ms": 0}

            role_data[role]["turns"] += 1
            role_data[role]["duration_ms"] += turn.endTimeMs - turn.startTimeMs

        speaker_stats = {}
        for role, data in role_data.items():
            speaker_stats[role] = SpeakerStats(
                turns=data["turns"], duration=f"{data['duration_ms'] / 1000:.1f}s"
            )

        return speaker_stats

    def _convert_to_milliseconds(self, time_str: str) -> int:
        """Convert time string format '6.500s' to milliseconds."""
        try:
            seconds = float(time_str.replace("s", ""))
            return int(seconds * 1000)
        except ValueError as e:
            raise ValueError(f"Invalid time format '{time_str}': {e}")

    async def _calculate_gcp_duration(self, start_time: str, end_time: str) -> str:
        """Calculate duration between two GCP timestamps."""
        start_ms = self._convert_to_milliseconds(start_time)
        end_ms = self._convert_to_milliseconds(end_time)
        duration_s = (end_ms - start_ms) / 1000
        return f"{duration_s:.1f}s"
