"""Tests for idea_lab/step1_generate.py."""
import pytest
from unittest.mock import AsyncMock, patch


_MOCK_RESPONSE = """{
  "ideas": [
    {"title": "A", "problem": "p1", "inputs": "i1", "outputs": "o1", "why_it_fits": "w1"},
    {"title": "B", "problem": "p2", "inputs": "i2", "outputs": "o2", "why_it_fits": "w2"},
    {"title": "C", "problem": "p3", "inputs": "i3", "outputs": "o3", "why_it_fits": "w3"}
  ]
}"""


@pytest.mark.asyncio
async def test_yields_required_fields():
    with patch("agents.idea_lab.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {"content": _MOCK_RESPONSE})()
        )
        from agents.idea_lab.step1_generate import idea_lab_step_1_stream

        updates = []
        async for u in idea_lab_step_1_stream(
            username="t", role="data scientist", pain="cleaning weekly reports"
        ):
            updates.append(u)
            for k in ("step", "message", "status", "progress"):
                assert k in u, f"Missing '{k}' in {u}"

        assert updates[-1]["status"] == "completed"
        assert updates[-1]["progress"] == 100


@pytest.mark.asyncio
async def test_completed_contains_three_ideas():
    with patch("agents.idea_lab.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {"content": _MOCK_RESPONSE})()
        )
        from agents.idea_lab.step1_generate import idea_lab_step_1_stream

        completed = None
        async for u in idea_lab_step_1_stream(username="t", role="r", pain="p"):
            if u["status"] == "completed":
                completed = u

        assert completed is not None
        assert "result" in completed
        assert len(completed["result"]["ideas"]) == 3
        assert completed["result"]["ideas"][0]["title"] == "A"


@pytest.mark.asyncio
async def test_error_on_llm_failure():
    with patch("agents.idea_lab.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(side_effect=Exception("boom"))
        from agents.idea_lab.step1_generate import idea_lab_step_1_stream

        updates = []
        async for u in idea_lab_step_1_stream(username="t", role="r", pain="p"):
            updates.append(u)

        assert updates[-1]["status"] == "error"
        assert "error" in updates[-1]


@pytest.mark.asyncio
async def test_french_default_language():
    with patch("agents.idea_lab.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {"content": _MOCK_RESPONSE})()
        )
        from agents.idea_lab.step1_generate import idea_lab_step_1_stream

        updates = []
        async for u in idea_lab_step_1_stream(username="t", role="r", pain="p"):
            updates.append(u)

        assert updates[0]["message"] == "Initialisation..."


@pytest.mark.asyncio
async def test_english_when_interface_language_en():
    with patch("agents.idea_lab.step1_generate.get_llm") as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(
            return_value=type("R", (), {"content": _MOCK_RESPONSE})()
        )
        from agents.idea_lab.step1_generate import idea_lab_step_1_stream

        updates = []
        async for u in idea_lab_step_1_stream(
            username="t", role="r", pain="p", interface_language="en"
        ):
            updates.append(u)

        assert updates[0]["message"] == "Initializing..."
