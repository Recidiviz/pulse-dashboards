# Map the feature flags to the environments that they need to be enabled in.

FEATURE_FLAGS: dict[str, list[str]] = {
    "TEST_FEATURE": ["dev", "demo"],
    "INTAKE_RESET": ["pytest", "demo", "dev", "pilot", "development", "staging"],
    "CLIENT_ADDITION": ["pytest", "demo", "dev", "pilot", "development"],
    "CLIENT_DELETION": ["pytest", "demo", "dev", "pilot", "development"],
    # Hard-stop guardrails: disconnect the socket and show the GuardrailModal.
    # Disabled everywhere until guardrail behavior is validated in staging.
    "GUARDRAILS_HARD_STOP": ["dev"],
}
