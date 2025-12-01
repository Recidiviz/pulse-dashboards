import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.utils.transcription.post_processing import (
    ConversationTurn,
    DeepgramTranscriptionInput,
    GCPTranscriptionInput,
    SpeakersClarification,
    TranscriptionProcessor,
)


class TestTranscriptionProcessor:
    @pytest.fixture
    def deepgram_sample_from_file(self):
        """Load Deepgram sample data from JSON file."""
        sample_file = Path(__file__).parent / "data/deepgram_transcription_sample.json"
        with open(sample_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return DeepgramTranscriptionInput(**data)

    @pytest.fixture
    def gcp_sample_from_file(self):
        """Load GCP sample data from JSON file."""
        sample_file = Path(__file__).parent / "data/gcp_transcription_sample.json"
        with open(sample_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return GCPTranscriptionInput(**data)

    def test_init_valid_deepgram_service(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        assert processor.diarization_service == "deepgram"
        assert processor.transcription == deepgram_sample_from_file

    def test_init_valid_gcp_service(self, gcp_sample_from_file):
        processor = TranscriptionProcessor(gcp_sample_from_file, "gcp")
        assert processor.diarization_service == "gcp"
        assert processor.transcription == gcp_sample_from_file

    def test_init_invalid_service(self, deepgram_sample_from_file):
        with pytest.raises(
            ValueError, match="diarization_service must be 'deepgram' or 'gcp'"
        ):
            TranscriptionProcessor(deepgram_sample_from_file, "invalid_service")

    def test_extract_deepgram_data(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        words, confidence, language = processor._extract_deepgram_data(
            deepgram_sample_from_file
        )

        assert len(words) > 0
        assert confidence == 1.0
        assert language == "en_us"
        assert words[0].word == "good"
        assert words[0].speaker == 0

    def test_extract_gcp_data(self, gcp_sample_from_file):
        processor = TranscriptionProcessor(gcp_sample_from_file, "gcp")
        words, confidence, language = processor._extract_gcp_data(gcp_sample_from_file)

        assert len(words) > 0
        assert confidence == 0.0
        assert language == "en-us"
        assert words[0].word == "Good"
        assert words[0].speakerTag == 1

    def test_group_deepgram_words_by_speaker(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        words = deepgram_sample_from_file.results.channels[0].alternatives[0].words
        grouped = processor._group_deepgram_words_by_speaker(words)

        assert len(grouped) >= 2  # At least two speaker turns
        # First group should be speaker 0 (caseworker)
        assert grouped[0]["speaker"] == 0
        assert "Good" in grouped[0]["words"]

    def test_convert_to_milliseconds(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")

        assert processor._convert_to_milliseconds("0.500s") == 500
        assert processor._convert_to_milliseconds("2.750s") == 2750
        assert processor._convert_to_milliseconds("10s") == 10000

    def test_convert_to_milliseconds_invalid_format(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        with pytest.raises(ValueError, match="Invalid time format"):
            processor._convert_to_milliseconds("invalid")

    @pytest.mark.asyncio
    async def test_calculate_gcp_duration(self, gcp_sample_from_file):
        processor = TranscriptionProcessor(gcp_sample_from_file, "gcp")
        duration = await processor._calculate_gcp_duration("1.000s", "3.500s")
        assert duration == "2.5s"

    def test_calculate_speaker_stats(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")

        conversation = [
            ConversationTurn(
                id="turn_1",
                role="caseworker",
                content="Hello there",
                startTime="0.000s",
                endTime="1.000s",
                startTimeMs=0,
                endTimeMs=1000,
                duration="1.0s",
                speakerTag=0,
                wordCount=2,
            ),
            ConversationTurn(
                id="turn_2",
                role="client",
                content="How are you",
                startTime="2.000s",
                endTime="3.000s",
                startTimeMs=2000,
                endTimeMs=3000,
                duration="1.0s",
                speakerTag=1,
                wordCount=3,
            ),
            ConversationTurn(
                id="turn_3",
                role="caseworker",
                content="I'm fine",
                startTime="4.000s",
                endTime="5.000s",
                startTimeMs=4000,
                endTimeMs=5000,
                duration="1.0s",
                speakerTag=0,
                wordCount=2,
            ),
        ]

        stats = processor._calculate_speaker_stats(conversation)

        assert "caseworker" in stats
        assert "client" in stats
        assert stats["caseworker"].turns == 2  # Two turns for caseworker
        assert stats["caseworker"].duration == "2.0s"  # 2 seconds total
        assert stats["client"].turns == 1  # One turn for client
        assert stats["client"].duration == "1.0s"  # 1 second total

    def test_format_conversation_for_llm(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")

        conversation = [
            ConversationTurn(
                id="turn_1",
                role="speaker_0",
                content="Hello there",
                startTime="0.000s",
                endTime="1.000s",
                startTimeMs=0,
                endTimeMs=1000,
                duration="1.0s",
                speakerTag=0,
                wordCount=2,
            ),
            ConversationTurn(
                id="turn_2",
                role="speaker_1",
                content="How are you",
                startTime="2.000s",
                endTime="3.000s",
                startTimeMs=2000,
                endTimeMs=3000,
                duration="1.0s",
                speakerTag=1,
                wordCount=3,
            ),
        ]

        formatted = processor._format_conversation_for_llm(conversation)
        expected = "speaker_0: Hello there\nspeaker_1: How are you"
        assert formatted == expected

    @pytest.mark.asyncio
    @patch("app.utils.transcription.post_processing.LLMAgentQA")
    async def test_convert_transcript_to_conversation_deepgram(
        self, mock_llm_agent, deepgram_sample_from_file
    ):
        # Mock LLM response
        mock_agent = AsyncMock()
        mock_agent.call.return_value = SpeakersClarification(
            speaker_1="caseworker", speaker_2="client"
        )
        mock_llm_agent.return_value = mock_agent

        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        result = await processor.convert_transcript_to_conversation()

        assert result.metadata.diarizationService == "deepgram"
        assert result.metadata.totalTurns > 0
        assert result.metadata.language == "en_us"
        assert len(result.conversation) > 0

        # Check that speaker roles have been assigned
        roles = {turn.role for turn in result.conversation}
        assert "caseworker" in roles or "client" in roles

    @pytest.mark.asyncio
    @patch("app.utils.transcription.post_processing.LLMAgentQA")
    async def test_convert_transcript_to_conversation_gcp(
        self, mock_llm_agent, gcp_sample_from_file
    ):
        # Mock LLM response
        mock_agent = AsyncMock()
        mock_agent.call.return_value = SpeakersClarification(
            speaker_1="caseworker", speaker_2="client"
        )
        mock_llm_agent.return_value = mock_agent

        processor = TranscriptionProcessor(gcp_sample_from_file, "gcp")
        result = await processor.convert_transcript_to_conversation()

        assert result.metadata.diarizationService == "gcp"
        assert result.metadata.totalTurns > 0
        assert len(result.conversation) > 0

        # Check that speaker roles have been assigned
        roles = {turn.role for turn in result.conversation}
        assert "caseworker" in roles or "client" in roles

    @pytest.mark.asyncio
    async def test_create_conversation_turns_deepgram(self, deepgram_sample_from_file):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        words = deepgram_sample_from_file.results.channels[0].alternatives[0].words

        turns = await processor._create_deepgram_conversation_turns(words)

        assert len(turns) > 0
        assert all(turn.id.startswith("turn_") for turn in turns)
        assert all(turn.role.startswith("speaker_") for turn in turns)
        assert all(turn.wordCount > 0 for turn in turns)
        assert all(turn.startTimeMs < turn.endTimeMs for turn in turns)

    @pytest.mark.asyncio
    async def test_create_conversation_turns_gcp(self, gcp_sample_from_file):
        processor = TranscriptionProcessor(gcp_sample_from_file, "gcp")
        words = gcp_sample_from_file.results[0].alternatives[0].words

        turns = await processor._create_gcp_conversation_turns(words)

        assert len(turns) > 0
        assert all(turn.id.startswith("turn_") for turn in turns)
        assert all(turn.role.startswith("speaker_") for turn in turns)
        assert all(turn.wordCount > 0 for turn in turns)
        assert all(turn.startTimeMs < turn.endTimeMs for turn in turns)

    @pytest.mark.asyncio
    async def test_convert_transcript_to_conversation_invalid_service(
        self, deepgram_sample_from_file
    ):
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        processor.diarization_service = "invalid"

        with pytest.raises(ValueError, match="Failed to process transcription"):
            await processor.convert_transcript_to_conversation()

    @pytest.mark.asyncio
    @patch("app.utils.transcription.post_processing.LLMAgentQA")
    async def test_deepgram_full_process_and_save_output(
        self, mock_llm_agent, deepgram_sample_from_file
    ):
        # Mock LLM response
        mock_agent = AsyncMock()
        mock_agent.call.return_value = SpeakersClarification(
            speaker_1="caseworker", speaker_2="client"
        )
        mock_llm_agent.return_value = mock_agent

        # Process transcription
        processor = TranscriptionProcessor(deepgram_sample_from_file, "deepgram")
        result = await processor.convert_transcript_to_conversation()

        # Save to JSON file
        output_file = (
            Path(__file__).parent / "data/deepgram_transcription_sample_output.json"
        )

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result.model_dump(), f, indent=2, ensure_ascii=False)

        # Verify file was created and contains expected data
        assert output_file.exists()

    @pytest.mark.asyncio
    @patch("app.utils.transcription.post_processing.LLMAgentQA")
    async def test_gcp_full_process_and_save_output(
        self, mock_llm_agent, gcp_sample_from_file
    ):
        # Mock LLM response
        mock_agent = AsyncMock()
        mock_agent.call.return_value = SpeakersClarification(
            speaker_1="caseworker", speaker_2="client"
        )
        mock_llm_agent.return_value = mock_agent

        # Process transcription
        processor = TranscriptionProcessor(gcp_sample_from_file, "gcp")
        result = await processor.convert_transcript_to_conversation()

        # Save to JSON file
        output_file = (
            Path(__file__).parent / "data/gcp_transcription_sample_output.json"
        )

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result.model_dump(), f, indent=2, ensure_ascii=False)

        # Verify file was created and contains expected data
        assert output_file.exists()
