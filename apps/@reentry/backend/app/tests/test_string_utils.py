"""Tests for string utility functions"""

from app.utils.string_utils import (
    normalize_locations,
)


class TestNormalizeLocations:
    """Tests for normalize_locations function"""

    def test_basic_replacement(self):
        """It should replace underscores with spaces"""
        locations = ["ORANGE_STREET_CCC"]
        assert normalize_locations(locations) == ["ORANGE STREET CCC"]

    def test_multiple_locations(self):
        """It should normalize multiple entries independently"""
        locations = ["ORANGE_STREET_CCC", "DISTRICT_4_-_BOISE"]
        result = normalize_locations(locations)
        assert set(result) == {"ORANGE STREET CCC", "DISTRICT 4 - BOISE"}

    def test_strip_spaces(self):
        """It should trim leading and trailing spaces before normalizing"""
        locations = ["  ORANGE_STREET_CCC  "]
        assert normalize_locations(locations) == ["ORANGE STREET CCC"]

    def test_duplicates_are_removed(self):
        """It should remove duplicate normalized locations"""
        locations = [
            "ORANGE_STREET_CCC",
            "ORANGE STREET CCC",  # already normalized
            "ORANGE_STREET_CCC   ",  # trailing space duplicate
        ]
        result = normalize_locations(locations)
        assert result == ["ORANGE STREET CCC"]

    def test_empty_list(self):
        """It should handle empty lists"""
        assert normalize_locations([]) == []

    def test_no_changes_needed(self):
        """It should return locations unchanged if already normalized"""
        locations = ["ORANGE STREET CCC", "DISTRICT 4 - BOISE"]
        result = normalize_locations(locations)
        assert set(result) == {"ORANGE STREET CCC", "DISTRICT 4 - BOISE"}

    def test_mixed_case(self):
        """It should preserve case (normalization does NOT lowercase)"""
        locations = ["Orange_Street_Ccc"]
        assert normalize_locations(locations) == ["Orange Street Ccc"]
