"""Tests for content hashing functionality."""

from app.utils.content_hash import compute_content_hash


class TestContentHash:
    """Test content hashing utilities."""

    def test_compute_content_hash_basic(self):
        """Test basic content hash computation."""
        content = "flowchart TD\n    A --> B"
        hash_result = compute_content_hash(content)

        assert isinstance(hash_result, str)
        assert len(hash_result) == 64  # SHA-256 hex digest length
        assert hash_result.isalnum()

    def test_compute_content_hash_consistent(self):
        """Test that identical content produces identical hashes."""
        content = "flowchart TD\n    A --> B\n    B --> C"

        hash1 = compute_content_hash(content)
        hash2 = compute_content_hash(content)

        assert hash1 == hash2

    def test_compute_content_hash_different_content(self):
        """Test that different content produces different hashes."""
        content1 = "flowchart TD\n    A --> B"
        content2 = "flowchart TD\n    A --> C"

        hash1 = compute_content_hash(content1)
        hash2 = compute_content_hash(content2)

        assert hash1 != hash2

    def test_compute_content_hash_with_additional_data(self):
        """Test content hash with additional data."""
        content = "flowchart TD\n    A --> B"
        additional_data = {"key": "value", "nested": {"data": 123}}

        hash_with_data = compute_content_hash(content, additional_data)
        hash_without_data = compute_content_hash(content)

        assert hash_with_data != hash_without_data

    def test_compute_content_hash_additional_data_consistency(self):
        """Test that additional data produces consistent hashes."""
        content = "flowchart TD\n    A --> B"
        additional_data = {"key": "value", "nested": {"data": 123}}

        hash1 = compute_content_hash(content, additional_data)
        hash2 = compute_content_hash(content, additional_data)

        assert hash1 == hash2

    def test_compute_content_hash_additional_data_order_independence(self):
        """Test that dict key order doesn't affect hash."""
        content = "flowchart TD\n    A --> B"
        data1 = {"a": 1, "b": 2}
        data2 = {"b": 2, "a": 1}

        hash1 = compute_content_hash(content, data1)
        hash2 = compute_content_hash(content, data2)

        assert hash1 == hash2

    def test_compute_content_hash_string_additional_data(self):
        """Test content hash with string additional data."""
        content = "flowchart TD\n    A --> B"
        additional_data = "some notes here"

        hash_with_notes = compute_content_hash(content, additional_data)
        hash_without_notes = compute_content_hash(content)

        assert hash_with_notes != hash_without_notes

    def test_unicode_content_handling(self):
        """Test that unicode content is handled correctly."""
        content_unicode = "flowchart TD\n    A --> B\n    # Comment with émojis 🚀"
        hash_result = compute_content_hash(content_unicode)

        assert isinstance(hash_result, str)
        assert len(hash_result) == 64

    def test_empty_content(self):
        """Test handling of empty content."""
        hash_result = compute_content_hash("")
        assert isinstance(hash_result, str)
        assert len(hash_result) == 64

    def test_none_additional_data(self):
        """Test that None additional data is handled correctly."""
        content = "flowchart TD\n    A --> B"

        hash_with_none = compute_content_hash(content, None)
        hash_without_data = compute_content_hash(content)

        assert hash_with_none == hash_without_data
