import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cors_headers_on_unhandled_exception(client: AsyncClient, monkeypatch):
    """
    When a route raises an unhandled exception, ErrorHandlingMiddleware should
    return a 500 with CORS headers.
    """
    import app.routes.client_router as client_router

    bug_text = "simulated bug"

    async def mock_function(*args, **kwargs):
        raise RuntimeError(bug_text)

    monkeypatch.setattr(client_router, "get_paginated_client_list", mock_function)

    response = await client.get(
        "/clients/", headers={"Origin": "http://localhost:3000"}
    )

    assert response.status_code == 500
    assert (
        response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    )
    assert "Internal server error" in response.json()["detail"]
    assert bug_text in response.json()["detail"]
