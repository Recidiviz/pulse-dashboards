"""Tests for string utility functions"""

from app.utils.string_utils import (
    escape_sql_string,
    normalize_code,
    normalize_locations,
)


class TestNormalizeCode:
    """Tests for normalize_code function"""

    def test_remove_punctuation(self):
        """Test that punctuation is removed"""
        assert normalize_code("UT-CCCI") == "utccci"
        assert normalize_code("ID_FACR") == "idfacr"
        assert normalize_code("AZ.TEST") == "aztest"

    def test_lowercase(self):
        """Test that code is converted to lowercase"""
        assert normalize_code("CCCI") == "ccci"
        assert normalize_code("CcCi") == "ccci"

    def test_combined(self):
        """Test combined punctuation removal and lowercase"""
        assert normalize_code("US-UT-CCCI") == "usutccci"

    def test_empty_string(self):
        """Test empty string handling"""
        assert normalize_code("") == ""

    def test_no_changes_needed(self):
        """Test string that's already normalized"""
        assert normalize_code("ccci") == "ccci"
        assert normalize_code("test") == "test"


class TestEscapeSqlString:
    """Tests for escape_sql_string function"""

    def test_escape_single_quotes(self):
        """Test that single quotes are properly escaped"""
        assert escape_sql_string("test's string") == "test''s string"
        assert escape_sql_string("it's a test") == "it''s a test"

    def test_no_quotes(self):
        """Test that strings without quotes remain unchanged"""
        assert escape_sql_string("test string") == "test string"

    def test_multiple_quotes(self):
        """Test that multiple single quotes are all escaped"""
        assert escape_sql_string("'it's' a 'test'") == "''it''s'' a ''test''"

    def test_empty_string(self):
        """Test empty string handling"""
        assert escape_sql_string("") == ""

    def test_only_quotes(self):
        """Test string with only quotes"""
        assert escape_sql_string("'''") == "''''''"


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
