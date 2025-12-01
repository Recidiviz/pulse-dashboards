from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient, Response


@pytest.fixture
def mock_google_credentials():
    """Mock Google credentials for authentication"""
    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_creds.token = "mock_token"
    return mock_creds


@pytest.fixture
def mock_google_auth(mock_google_credentials):
    """Mock Google authentication module"""
    with patch("app.utils.address_autocomplete.credentials", mock_google_credentials):
        with patch("app.utils.address_autocomplete.project", "mock_project"):
            yield mock_google_credentials


class TestAutocompleteAddress:
    """Tests for /autocomplete-address endpoint"""

    @pytest.mark.asyncio
    async def test_autocomplete_address_success(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test successful address autocomplete with valid input"""
        # Mock the Google Places API response
        mock_response = {
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "place_id_1",
                        "text": {"text": "123 Main St, New York, NY, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "123 Main St"},
                            "secondaryText": {"text": "New York, NY, USA"},
                        },
                    }
                },
                {
                    "placePrediction": {
                        "placeId": "place_id_2",
                        "text": {"text": "456 Main St, Brooklyn, NY, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "456 Main St"},
                            "secondaryText": {"text": "Brooklyn, NY, USA"},
                        },
                    }
                },
            ]
        }

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            # Create a mock response object
            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-address?input=123 Main")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["suggestions"]) == 2
            assert data["suggestions"][0]["place_id"] == "place_id_1"
            assert (
                data["suggestions"][0]["description"]
                == "123 Main St, New York, NY, USA"
            )
            assert data["suggestions"][0]["main_text"] == "123 Main St"
            assert data["suggestions"][0]["secondary_text"] == "New York, NY, USA"

    @pytest.mark.asyncio
    async def test_autocomplete_address_empty_results(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test address autocomplete with no matching results"""
        mock_response = {"suggestions": []}

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-address?input=xyz123nonexistent")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["suggestions"]) == 0

    @pytest.mark.asyncio
    async def test_autocomplete_address_api_error(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test address autocomplete when Google API returns an error"""
        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            # Simulate API error response
            mock_http_response = Response(
                status_code=400,
                json={"error": {"message": "Invalid request"}},
            )
            mock_http_response.raise_for_status = MagicMock(
                side_effect=Exception("API error")
            )
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-address?input=test")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert "error" in data
            assert len(data["suggestions"]) == 0

    @pytest.mark.asyncio
    async def test_autocomplete_address_missing_input(self, client: AsyncClient):
        """Test address autocomplete without input parameter"""
        response = await client.get("/autocomplete-address")
        assert response.status_code == 422  # FastAPI validation error

    @pytest.mark.asyncio
    async def test_autocomplete_address_short_input(self, client: AsyncClient):
        """Test address autocomplete with input shorter than minimum length"""
        response = await client.get("/autocomplete-address?input=a")
        assert response.status_code == 422  # FastAPI validation error

    @pytest.mark.asyncio
    async def test_autocomplete_address_invalid_credentials(self, client: AsyncClient):
        """Test address autocomplete with invalid Google credentials"""
        mock_creds = MagicMock()
        mock_creds.valid = False
        mock_creds.token = None

        with patch("app.utils.address_autocomplete.credentials", mock_creds):
            with patch("app.utils.address_autocomplete.project", "mock_project"):
                # Mock the refresh method
                mock_creds.refresh = MagicMock(side_effect=Exception("Auth failed"))

                response = await client.get("/autocomplete-address?input=test address")

                assert response.status_code == 200
                data = response.json()
                assert data["success"] is False
                assert "error" in data


class TestAutocompleteCity:
    """Tests for /autocomplete-city endpoint"""

    @pytest.mark.asyncio
    async def test_autocomplete_city_success(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test successful city autocomplete with valid input"""
        mock_response = {
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "city_place_id_1",
                        "text": {"text": "New York, NY, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "New York"},
                            "secondaryText": {"text": "NY, USA"},
                        },
                    }
                },
                {
                    "placePrediction": {
                        "placeId": "city_place_id_2",
                        "text": {"text": "Newark, NJ, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "Newark"},
                            "secondaryText": {"text": "NJ, USA"},
                        },
                    }
                },
            ]
        }

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-city?input=New")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["suggestions"]) == 2
            assert data["suggestions"][0]["place_id"] == "city_place_id_1"
            assert data["suggestions"][0]["main_text"] == "New York"
            assert data["suggestions"][0]["state_code"] == "NY"
            assert data["suggestions"][1]["state_code"] == "NJ"

    @pytest.mark.asyncio
    async def test_autocomplete_city_with_state_filter(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test city autocomplete with state filter"""
        mock_response = {
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "city_place_id_1",
                        "text": {"text": "Springfield, IL, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "Springfield"},
                            "secondaryText": {"text": "Illinois, USA"},
                        },
                    }
                }
            ]
        }

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-city?input=Spring&state=IL")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["suggestions"]) == 1
            assert data["suggestions"][0]["main_text"] == "Springfield"
            assert data["suggestions"][0]["state_code"] == "IL"

    @pytest.mark.asyncio
    async def test_autocomplete_city_with_state_name(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test city autocomplete with full state name instead of abbreviation"""
        mock_response = {
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "city_place_id_1",
                        "text": {"text": "Los Angeles, CA, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "Los Angeles"},
                            "secondaryText": {"text": "California, USA"},
                        },
                    }
                }
            ]
        }

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-city?input=Los&state=California")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["suggestions"]) == 1
            assert data["suggestions"][0]["state_code"] == "CA"

    @pytest.mark.asyncio
    async def test_autocomplete_city_empty_results(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test city autocomplete with no matching results"""
        mock_response = {"suggestions": []}

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-city?input=xyz123nonexistent")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["suggestions"]) == 0

    @pytest.mark.asyncio
    async def test_autocomplete_city_with_address_suggestion_selected(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test city autocomplete with address_suggestion_selected parameter"""
        mock_response = {
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "city_place_id_1",
                        "text": {"text": "Boston, MA, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "Boston"},
                            "secondaryText": {"text": "Massachusetts, USA"},
                        },
                    }
                }
            ]
        }

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get(
                "/autocomplete-city?input=Boston&address_suggestion_selected=true"
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    @pytest.mark.asyncio
    async def test_autocomplete_city_api_error(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test city autocomplete when Google API returns an error"""
        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=500,
                json={"error": {"message": "Internal server error"}},
            )
            mock_http_response.raise_for_status = MagicMock(
                side_effect=Exception("API error")
            )
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-city?input=test")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is False
            assert "error" in data

    @pytest.mark.asyncio
    async def test_autocomplete_city_missing_input(self, client: AsyncClient):
        """Test city autocomplete without input parameter"""
        response = await client.get("/autocomplete-city")
        assert response.status_code == 422  # FastAPI validation error

    @pytest.mark.asyncio
    async def test_autocomplete_city_short_input(self, client: AsyncClient):
        """Test city autocomplete with input shorter than minimum length"""
        response = await client.get("/autocomplete-city?input=a")
        assert response.status_code == 422  # FastAPI validation error

    @pytest.mark.asyncio
    async def test_autocomplete_city_state_code_extraction(
        self, client: AsyncClient, mock_google_auth
    ):
        """Test state code extraction from different secondary text formats"""
        mock_response = {
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "city_1",
                        "text": {"text": "Miami, FL, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "Miami"},
                            "secondaryText": {"text": "FL, USA"},
                        },
                    }
                },
                {
                    "placePrediction": {
                        "placeId": "city_2",
                        "text": {"text": "Atlanta, Georgia, USA"},
                        "structuredFormat": {
                            "mainText": {"text": "Atlanta"},
                            "secondaryText": {"text": "Georgia, USA"},
                        },
                    }
                },
            ]
        }

        with patch("httpx.AsyncClient") as mock_httpx_client:
            mock_client_instance = AsyncMock()
            mock_httpx_client.return_value.__aenter__.return_value = (
                mock_client_instance
            )

            mock_http_response = Response(
                status_code=200,
                json=mock_response,
            )
            mock_http_response.raise_for_status = MagicMock()
            mock_client_instance.post = AsyncMock(return_value=mock_http_response)

            response = await client.get("/autocomplete-city?input=test")

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["suggestions"]) == 2
            # Check state code extraction
            assert data["suggestions"][0]["state_code"] == "FL"
            assert data["suggestions"][1]["state_code"] == "GA"
