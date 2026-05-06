# CPA Intake Chatbot

An AI-driven intake assessment delivered as a real-time chat. A client (justice-impacted individual) connects via WebSocket, the LLM conducts a structured interview section-by-section, and the conversation is persisted for caseworker review and downstream plan generation.

---

## How it works

```
Client browser
    │  WebSocket (socket.io)
    ▼
SocketManager          — receives messages, runs guardrails, owns the socket lifecycle
    │
    ▼
ConversationGraph      — LangGraph state machine: decides questions, detects section completion
    │
    ▼
LLM                    — generates responses using per-config prompts + GLOBAL_BEHAVIORAL_RULES
    │
    ▼
DatabaseManager        — persists every message, tracks current section, manages intake state
```

A single intake is divided into **sections** (e.g. Housing, Employment, Support Systems). The graph works through them one at a time using structured output (`IsSectionComplete`) to decide when to advance. When all sections are done, the graph emits a closing remark and the intake is marked `COMPLETED`.

---

## Key files

| File                    | Purpose                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `socket_manager.py`     | WebSocket event handlers; runs guardrails before the graph sees a message                 |
| `conversation_graph.py` | LangGraph graph; section advancement, LLM calls, LLMAJ safety check                       |
| `guardrails.py`         | All three guardrail layers — see `GUARDRAILS.md`                                          |
| `prompts.py`            | All LLM prompts: `GLOBAL_BEHAVIORAL_RULES`, question prompt, LLMAJ prompt, closing prompt |
| `db_manager.py`         | Database reads/writes: messages, intake state, locking, section retrieval                 |
| `schemas.py`            | Pydantic models for WebSocket payloads and client context                                 |

---

## Assessment configs

Each state/program has a config that controls the LLM's persona and the sections to collect. Configs are managed via the **Config I/O tab** in the staff UI. Local seed files (`app/core/data_config/seed_assessment_configs/`) are used for development only.

Each config defines:

- `prompts.role` / `prompts.tone` / `prompts.system_message` — per-state LLM personality
- `sections[]` — ordered list of sections, each with a title and `required_information`

**`GLOBAL_BEHAVIORAL_RULES`** (defined in `prompts.py`) is prepended to every config's `system_message` at runtime. It enforces universal behavioral rules regardless of what a config says — no human identity claims, no confidentiality claims, crisis redirection, and more.

---

## Frontend

**Client-facing UI:** `libs/@reentry/frontend-shared/src/components/intake/`

- `ChatInterface/` — live chat, message bubbles, TTS button
- `GuardrailModal.tsx` — soft-stop modal (client can continue after acknowledging)
- `LockedInterstitial/` — hard-stop screen shown after intake is locked
- `IntakeRouter.tsx` — routes between pre-intake, chat, survey, and completion screens

**Staff/admin view:** `apps/@reentry/frontend/app/(protected)/intake/[intakeId]/chat-history/`

- Full conversation history per section with hard-stop messages highlighted in red
- PDF export

---

## Testing

```bash
cd apps/@reentry/backend
uv run pytest app/tests/                                        # full suite
uv run pytest app/tests/test_guardrails.py                     # guardrail unit tests
uv run pytest app/tests/test_intake_conversation_graph.py      # graph logic
```

**AI persona test harness** (`/ai-test-harness` in the staff UI) runs automated intake sessions using pre-defined client personas to regression-test conversation quality without a real client.
