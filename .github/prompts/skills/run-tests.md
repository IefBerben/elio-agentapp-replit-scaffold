# Skill: run-tests

## Inputs
- `usecase` — snake_case name of the agent being tested
- `step_n` — step number (optional, omit to run all tests for usecase)
- `scope` — `backend` (default) or `frontend` or `all`

## Process

### Backend tests (always run after each backend file)

Run from the **workspace root** — use `;` (not `&&`) so it works in both bash and PowerShell.
Use `uv run` (no venv activation needed):
- **All platforms:** `cd back; uv run pytest agents/{usecase}/tests/ -v`

### Frontend tests (run after writing the page component — step 8)

```
cd front; npm test
```

### LLM mocking — mandatory for all backend tests

Never call `get_llm()` directly in tests. Always mock it:

```python
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.fixture
def mock_llm():
    with patch("agents.{usecase}.step{N}_{name}.get_llm") as mock:
        structured = MagicMock()
        structured.ainvoke = AsyncMock(return_value=YourOutputModel(...))
        mock.return_value.with_structured_output.return_value = structured
        yield mock
```

Rules:
- **Each story must have at least one test** — the test validates the story's `success_criterion` programmatically
- Run backend tests after EACH backend file is written or modified
- Run frontend tests once after the page component is written (step 8)
- **Regression gate:** when a story is complete, run tests for ALL previous stories of the same usecase — not just the current story. Use `uv run pytest agents/{usecase}/tests/ -v` (runs ALL test files). A new story must never break a previously passing test.
- If any test fails: fix the code immediately, re-run, confirm green before continuing
- Never skip tests because "the code looks right"
- If a test itself is wrong (bad mock, wrong assertion): fix the test AND explain why to the PO in plain French
- New business logic = new test — never add code without a corresponding test
- Never call `get_llm()` without mocking — tests must not require valid Azure credentials

## Output

Report results in plain French, always this format:

```
🧪 Tests backend : {n}/{total} passants ✅
🧪 Tests frontend : {n}/{total} passants ✅
```

or if failing:

```
🧪 Tests : {n}/{total} passants ❌
   - {test_name} : FAILED — je corrige maintenant
```

Include in the closing report:
```
Tests : ✅ {n}/{total} passants — aucune régression sur les stories précédentes
```
