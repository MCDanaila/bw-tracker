"""Tests for AI endpoints."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.main import create_app
from app.dependencies import CurrentUser
from app.schemas.ai import GenerateSuggestionRequest, GenerateSuggestionResponse


@pytest.fixture
def mock_current_user():
    """Create a mock coach user for testing."""
    return CurrentUser(id="test-coach-id", role="coach", email="coach@test.com")


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock_sb = AsyncMock()

    # Mock the insert operation
    mock_table = MagicMock()
    mock_insert = MagicMock()
    mock_execute = AsyncMock(return_value=MagicMock(data=[{"id": "test-suggestion-id"}]))

    mock_insert.execute = mock_execute
    mock_table.insert = MagicMock(return_value=mock_insert)
    mock_sb.table = MagicMock(return_value=mock_table)

    return mock_sb


@pytest.fixture
def client(mock_current_user, mock_supabase):
    """Create a test client with mocked JWT verification and Supabase."""
    from app.dependencies import get_current_user, get_user_supabase

    app = create_app()
    # Use FastAPI's override_dependency to mock the auth check
    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    # Mock Supabase client
    app.dependency_overrides[get_user_supabase] = lambda: mock_supabase

    return TestClient(app)


class TestGenerateDietSuggestion:
    """Tests for POST /ai/generate-diet-suggestion endpoint."""

    def test_generate_diet_suggestion_success(self, client):
        """Test successful diet suggestion generation."""
        request_data = {
            "athlete_id": "test-athlete-123",
            "query_text": "Create a 7-day cutting plan with Mediterranean foods",
        }

        response = client.post(
            "/ai/generate-diet-suggestion",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "suggestion_id" in data
        assert "suggestion_text" in data
        assert isinstance(data["suggestion_id"], str)
        assert len(data["suggestion_id"]) > 0

    def test_generate_diet_suggestion_missing_query(self, client):
        """Test validation: query_text is required."""
        request_data = {
            "athlete_id": "test-athlete-123",
            "query_text": "",  # Too short
        }

        response = client.post(
            "/ai/generate-diet-suggestion",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 422  # Validation error

    def test_generate_diet_suggestion_missing_athlete_id(self, client):
        """Test validation: athlete_id is required."""
        request_data = {
            "query_text": "Create a 7-day cutting plan with Mediterranean foods",
        }

        response = client.post(
            "/ai/generate-diet-suggestion",
            json=request_data,
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 422  # Validation error
