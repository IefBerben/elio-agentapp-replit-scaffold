"""Tests for step1_generate.py — _reference agent.

HOW TO USE:
    Run from the back/ directory:
        .venv/Scripts/python -m pytest agents/_reference/tests/ -v

    These tests mock the LLM — no Azure credentials needed.
"""
import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_yields_required_fields():
    """Every yield must contain step, message, status, progress."""
    with patch("agents._reference.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {
                "content": '{"summary": "Test summary", "key_points": ["Point A", "Point B"]}'
            })()
        )
        from agents._reference.step1_generate import reference_step_1_stream

        updates = []
        async for update in reference_step_1_stream(
            username="test-user", prompt="Test prompt"
        ):
            updates.append(update)
            assert "step" in update, f"Missing 'step' in: {update}"
            assert "message" in update, f"Missing 'message' in: {update}"
            assert "status" in update, f"Missing 'status' in: {update}"
            assert "progress" in update, f"Missing 'progress' in: {update}"

        assert len(updates) > 0, "No updates yielded"
        assert updates[-1]["status"] == "completed"
        assert updates[-1]["progress"] == 100


@pytest.mark.asyncio
async def test_completed_contains_result():
    """The completed yield must contain the business result."""
    with patch("agents._reference.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {
                "content": '{"summary": "My summary", "key_points": ["Point 1"]}'
            })()
        )
        from agents._reference.step1_generate import reference_step_1_stream

        completed = None
        async for update in reference_step_1_stream(
            username="test-user", prompt="Test prompt"
        ):
            if update["status"] == "completed":
                completed = update

        assert completed is not None, "No completed event received"
        assert "result" in completed, "completed event missing 'result' key"
        assert "summary" in completed["result"]
        assert "key_points" in completed["result"]


@pytest.mark.asyncio
async def test_error_handling_yields_error_dict():
    """Step must yield error status when LLM fails — never raise an exception."""
    with patch("agents._reference.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            side_effect=Exception("Simulated LLM failure")
        )
        from agents._reference.step1_generate import reference_step_1_stream

        updates = []
        async for update in reference_step_1_stream(
            username="test-user", prompt="Test prompt"
        ):
            updates.append(update)

        assert updates[-1]["status"] == "error", "Expected error status"
        assert "error" in updates[-1], "error event missing 'error' key"


@pytest.mark.asyncio
async def test_invalid_json_yields_error():
    """Step must handle LLM returning malformed JSON gracefully."""
    with patch("agents._reference.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {"content": "This is not JSON at all"})()
        )
        from agents._reference.step1_generate import reference_step_1_stream

        updates = []
        async for update in reference_step_1_stream(
            username="test-user", prompt="Test prompt"
        ):
            updates.append(update)

        assert updates[-1]["status"] == "error"


@pytest.mark.asyncio
async def test_progress_increases():
    """Progress values must increase from 0 to 100 across yields."""
    with patch("agents._reference.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {
                "content": '{"summary": "ok", "key_points": ["x"]}'
            })()
        )
        from agents._reference.step1_generate import reference_step_1_stream

        progress_values = []
        async for update in reference_step_1_stream(
            username="test-user", prompt="Test prompt"
        ):
            progress_values.append(update["progress"])

        # First progress must be 0
        assert progress_values[0] == 0, "First progress must be 0"
        # Last progress must be 100
        assert progress_values[-1] == 100, "Last progress must be 100"
        # Progress must never decrease
        for i in range(1, len(progress_values)):
            assert progress_values[i] >= progress_values[i - 1], \
                f"Progress decreased: {progress_values[i-1]} -> {progress_values[i]}"


@pytest.mark.asyncio
async def test_stream_safe_catches_azure_auth_error():
    """@stream_safe must catch Azure auth errors and yield error dict."""

    class AuthenticationError(Exception):
        pass

    with patch("agents._reference.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            side_effect=AuthenticationError("Invalid Azure credentials")
        )
        from agents._reference.step1_generate import reference_step_1_stream

        updates = []
        async for update in reference_step_1_stream(
            username="test-user", prompt="Test prompt"
        ):
            updates.append(update)

        assert updates[-1]["status"] == "error", "Expected error status from stream_safe"
        assert updates[-1].get("error_type") == "AuthenticationError"
        assert "error" in updates[-1]


@pytest.mark.asyncio
async def test_stream_safe_yields_po_friendly_message():
    """Error message must be in French and actionable for the PO."""

    class RateLimitError(Exception):
        pass

    with patch("agents._reference.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            side_effect=RateLimitError("429 Too Many Requests")
        )
        from agents._reference.step1_generate import reference_step_1_stream

        updates = []
        async for update in reference_step_1_stream(
            username="test-user", prompt="Test prompt"
        ):
            updates.append(update)

        assert updates[-1]["status"] == "error"
        # Message doit contenir ❌ et être en français
        assert "❌" in updates[-1]["message"], "PO-friendly message must start with ❌"
        # Message doit être actionnable
        assert any(
            word in updates[-1]["message"]
            for word in ["Quota", "Azure", "Erreur", "Connexion", "impossible", "Attends", "Vérifie"]
        ), "Error message must be actionable in French"
