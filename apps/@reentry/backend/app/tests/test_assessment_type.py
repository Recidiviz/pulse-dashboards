from unittest.mock import mock_open, patch

import pytest

from app.models.assessment import AssessmentType
from app.utils.assessment_runner import get_assessments_type


class TestGetAssessmentsType:
    @pytest.fixture
    def mock_json_data(self):
        return {
            "US_ID": {"name": "Idaho", "assessment_types": ["lsir"]},
            "US_AZ": {"name": "Arizona", "assessment_types": ["oras_rt", "oras_pit"]},
            "US_FL": {"name": "Florida", "assessment_types": []},
            "US_CA": {
                "name": "California"
                # Missing assessment_types
            },
            "US_NY": {"name": "New York", "assessment_types": ["invalid_type", "lsir"]},
        }

    @patch("builtins.open", new_callable=mock_open)
    @patch("json.load")
    def test_valid_scenarios(self, mock_json_load, mock_file, mock_json_data):
        """Test all valid data scenarios"""
        mock_json_load.return_value = mock_json_data

        # Single assessment
        result = get_assessments_type("US_ID")
        assert result == [AssessmentType.LSIR]

        # Multiple assessments
        result = get_assessments_type("US_AZ")
        assert len(result) == 2
        assert AssessmentType.ORAS_RT in result
        assert AssessmentType.ORAS_PIT in result

        # Invalid assessment, getting LSIR as default
        result = get_assessments_type("US_NY")
        assert result == [AssessmentType.LSIR]

    @patch("builtins.open", new_callable=mock_open)
    @patch("json.load")
    def test_default_scenarios(self, mock_json_load, mock_file, mock_json_data):
        """Test all scenarios that should return default [LSIR]"""
        mock_json_load.return_value = mock_json_data

        # Empty assessment_types list
        result = get_assessments_type("US_FL")
        assert result == [AssessmentType.LSIR]

        # Missing assessment_types field
        result = get_assessments_type("US_CA")
        assert result == [AssessmentType.LSIR]

        # Non-existent state
        result = get_assessments_type("US_XX")
        assert result == [AssessmentType.LSIR]

    @patch("builtins.open", new_callable=mock_open)
    @patch("json.load")
    def test_edge_cases(self, mock_json_load, mock_file):
        # State info is not a dict
        mock_json_load.return_value = {"US_ID": "not_a_dict"}
        result = get_assessments_type("US_ID")
        assert result == [AssessmentType.LSIR]

        # All assessments invalid
        mock_json_load.return_value = {
            "US_ID": {"assessment_types": ["invalid1", "invalid2"]}
        }
        result = get_assessments_type("US_ID")
        assert result == [AssessmentType.LSIR]
