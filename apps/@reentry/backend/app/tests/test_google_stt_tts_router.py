from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_text_to_speech_invalid_encoding(client: AsyncClient):
    with patch(
        "app.auth.intake.auth_client_user.decode_jwt_token"
    ) as mock_verify_token:
        mock_verify_token.return_value = {
            "sub": "test-client-id",
            "token_type": "client",
        }

        response = await client.post(
            "/intake/services/text-to-speech",
            json={
                "text": "Hello world",
                "encoding": "INVALID_FORMAT",
            },
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 422
    assert "input should be" in response.text.lower()
