# CPA Chatbot Guardrails

Every client message passes through guardrail layers before and during LLM processing. A triggered guardrail short-circuits the normal response flow.

---

## The layers

### Layer 1 — Deterministic regex

Synchronous pattern matching. No LLM call, no latency.

**Hard stops:**

- `crisis` — self-harm keywords and phrases
- `harm_to_others` — intent to harm another person

**Soft stops:**

- `prompt_injection` — jailbreak patterns (role assignment, instruction override attempts)
- `char_limit` — messages over 2500 characters

Patterns are defined in `guardrails.py`. To add a new pattern, add to the relevant `re.compile` list — no other changes required.

### Layer 2 — Prompt engineering

`GLOBAL_BEHAVIORAL_RULES` (in `prompts.py`) is prepended to every system message at runtime. It instructs the LLM how to handle edge cases that slip through regex: frustration, non-English input, skip requests, AI identity questions, crisis signals.

No runtime cost — this layer is baked into every LLM call.

### Layer 3A — OpenAI moderation API

Runs in `socket_manager.py` as part of `run_guardrails()` — before the message reaches the graph. If triggered, the graph never sees the message.

Watches specific harm categories on the OpenAI moderation endpoint:

- `openai_moderation:self-harm` — watches `self-harm/intent`
- `openai_moderation:harm_to_others` — watches `harassment/threatening` and `violence`

Fires above a confidence threshold of 0.75. Category mappings and thresholds are defined in `MODERATION_CATEGORY_MAP` in `guardrails.py` — adding a new category group requires only a new tuple there.

Skipped if a sync hard-stop (Layer 1) already fired on the same message.

### Layer 3B — LLMAJ (LLM-as-Judge)

Runs inside the conversation graph (`_evaluate_section`), in an `asyncio.gather` alongside the `IsSectionComplete` structured output call. A triggered result is processed before the section-completion result.

Classifies the message across three categories:

- `llmaj:self-harm` — present or future self-harm intent, including indirect signals
- `llmaj:harm-to-others` — intent to harm another person or group
- `llmaj:prompt-injection` — multi-turn manipulation or persona-assignment attempts (soft stop)

Fires only when both `result` is set AND `confidence_score ≥ 0.80`. Full prompt and scoring logic in `prompts.py` (`generate_llmaj_prompt`).

`llmaj:prompt-injection` is **mutually exclusive** with the harm categories — a jailbreak attempt is never treated as a crisis signal, even if it uses distressing language.

---

## Hard stop vs soft stop

|                                   | Hard stop                              | Soft stop                 |
| --------------------------------- | -------------------------------------- | ------------------------- |
| **Socket**                        | Disconnected immediately               | Stays connected           |
| **Chat input**                    | Blocked (intake locked)                | Re-enabled after modal    |
| **Intake record**                 | Locked in DB; staff must unlock        | No change                 |
| **Slack alert**                   | Fires                                  | Fires                     |
| **Staff chat history**            | Shown with red "⚠️ Flagged:" indicator | Shown as a normal message |
| **Client chat / graph reconnect** | Hidden (`visible_filter`)              | Hidden (`visible_filter`) |

Hard-stop types: `crisis`, `harm_to_others`, `openai_moderation:self-harm`, `openai_moderation:harm_to_others`, `llmaj:self-harm`, `llmaj:harm-to-others`

Soft-stop types: `prompt_injection`, `char_limit`, `llmaj:prompt-injection`

---

## Message visibility

`IntakeMessage.guardrailed_by` — JSON column storing the list of guardrail type strings that fired on a message (e.g. `["llmaj:prompt-injection"]`).

`IntakeMessage.visible_filter()` — SQL filter used by client-facing and graph-reconnect queries. Excludes any message where `guardrailed_by IS NOT NULL`, unless `false_positive = true`. This ensures:

- Clients never see their flagged messages
- The graph never re-evaluates a previously flagged message on reconnect

The admin chat history bypasses this filter and returns all messages. Hard-stop messages are visually flagged in the UI; soft-stop messages appear as plain messages to avoid unnecessarily implicating clients for curiosity.

---

## Guardrail type definitions

Types are defined as `StrEnum` in `guardrails.py`:

```python
class HardStopGuardrailType(StrEnum):
    CRISIS = "crisis"
    HARM_TO_OTHERS = "harm_to_others"
    OPENAI_MODERATION_SELF_HARM = "openai_moderation:self-harm"
    OPENAI_MODERATION_HARM_TO_OTHERS = "openai_moderation:harm_to_others"
    LLMAJ_SELF_HARM = "llmaj:self-harm"
    LLMAJ_HARM_TO_OTHERS = "llmaj:harm-to-others"

class SoftStopGuardrailType(StrEnum):
    PROMPT_INJECTION = "prompt_injection"
    CHAR_LIMIT = "char_limit"
    LLMAJ_PROMPT_INJECTION = "llmaj:prompt-injection"
```

`HARD_STOP_GUARDRAIL_TYPES` (a `frozenset`) and `isHardStopGuardrailType` (a TypeScript type guard in `eventTypes.ts`) are the canonical references on their respective sides of the stack.

---

## Slack alerts

A Slack alert fires for every hard-stop and soft-stop event. Alerts include the state, client pseudo ID, intake UUID, and guardrail type. Message content is deliberately excluded to avoid surfacing PII.

If `RECIDIVIZ_SLACK_GUARDRAIL_ALERT_WEBHOOK_URL` is not configured, an error is logged and a Sentry alert fires — a missing webhook during a crisis event is treated as an operational failure, not a silent no-op.
