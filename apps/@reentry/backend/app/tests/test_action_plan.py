import os

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


@pytest.mark.skipif(not os.getenv("WITH_LLM_TESTS"), reason="LLM tests not activates")
def test_action_plan():
    response = client.get(
        "/action-plan?decision_tree_id=123&client_data_id=456&resource_ids=789"
    )
    assert response.status_code == 200
    assert "output" in response.json()
