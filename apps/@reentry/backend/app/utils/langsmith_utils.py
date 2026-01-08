"""
LangSmith utilities for improved trace legibility.

This module provides helper functions to create consistent metadata/tags
for LangSmith traces and config builders for LangGraph invocations.
"""

from datetime import datetime
from typing import Any

from langchain_core.runnables.config import RunnableConfig

from app.core.config import settings


def create_langsmith_metadata(
    client_pseudo_id: str | None = None,
    plan_id: str | None = None,
    intake_id: str | None = None,
    assessment_config_id: str | None = None,
    workflow_type: str | None = None,
    **extra_metadata: Any,
) -> dict[str, Any]:
    """
    Create consistent metadata for LangSmith traces.

    Args:
        client_pseudo_id: Client's pseudonymized ID (first 8 chars used)
        plan_id: Plan ID if applicable
        intake_id: Intake ID if applicable
        assessment_config_id: Assessment config ID if applicable
        workflow_type: Type of workflow (e.g., 'plan_generation', 'intake_conversation')
        **extra_metadata: Additional metadata fields

    Returns:
        Dictionary of metadata for LangSmith traces
    """
    metadata = {
        "environment": settings.ENV_NAME,
        "deploy_env": settings.DEPLOY_ENV,
        "timestamp": datetime.utcnow().isoformat(),
    }

    if client_pseudo_id:
        # Include both short (for display) and full ID (for debugging)
        metadata["client_pseudo_id_short"] = client_pseudo_id[:8]
        metadata["client_pseudo_id"] = client_pseudo_id

    if plan_id:
        metadata["plan_id"] = str(plan_id)

    if intake_id:
        metadata["intake_id"] = str(intake_id)

    if assessment_config_id:
        metadata["assessment_config_id"] = assessment_config_id

    if workflow_type:
        metadata["workflow_type"] = workflow_type

    # Add any extra metadata
    metadata.update(extra_metadata)

    return metadata


def create_langsmith_tags(
    workflow_type: str | None = None,
    state_code: str | None = None,
    **extra_tags: str,
) -> list[str]:
    """
    Create consistent tags for LangSmith traces.

    Tags are useful for filtering and grouping traces in the LangSmith UI.

    Args:
        workflow_type: Type of workflow (e.g., 'plan_generation', 'intake_conversation')
        state_code: US state code if applicable (e.g., 'US_UT', 'US_ID')
        **extra_tags: Additional tags as key-value pairs

    Returns:
        List of tags for LangSmith traces
    """
    tags = [
        f"env:{settings.ENV_NAME}",
    ]

    if workflow_type:
        tags.append(f"workflow:{workflow_type}")

    if state_code:
        tags.append(f"state:{state_code}")

    # Add extra tags
    for key, value in extra_tags.items():
        tags.append(f"{key}:{value}")

    return tags


def build_langsmith_config(
    thread_id: str,
    run_name: str,
    callbacks: list | None = None,
    client_pseudo_id: str | None = None,
    plan_id: str | None = None,
    intake_id: str | None = None,
    workflow_type: str | None = None,
    state_code: str | None = None,
    recursion_limit: int = 50,
    **extra_metadata: Any,
) -> RunnableConfig:
    """
    Build a complete LangSmith-compatible config for LangGraph invocations.

    This function creates a config with:
    - Semantic thread_id
    - Meaningful run_name
    - Rich metadata for debugging
    - Tags for filtering

    Args:
        thread_id: Semantic thread identifier
        run_name: Human-readable name for the trace
        callbacks: List of callbacks (tracer will be added if available)
        client_pseudo_id: Client's pseudonymized ID
        plan_id: Plan ID if applicable
        intake_id: Intake ID if applicable
        workflow_type: Type of workflow
        state_code: US state code if applicable
        recursion_limit: Maximum recursion depth for LangGraph
        **extra_metadata: Additional metadata fields

    Returns:
        RunnableConfig for LangGraph invocations
    """
    from app.core.config import tracer

    config: RunnableConfig = {
        "configurable": {"thread_id": thread_id},
        "run_name": run_name,
        "recursion_limit": recursion_limit,
        "metadata": create_langsmith_metadata(
            client_pseudo_id=client_pseudo_id,
            plan_id=plan_id,
            intake_id=intake_id,
            workflow_type=workflow_type,
            **extra_metadata,
        ),
        "tags": create_langsmith_tags(
            workflow_type=workflow_type,
            state_code=state_code,
        ),
        "callbacks": callbacks or [],
    }

    if tracer:
        config["callbacks"].append(tracer)

    return config
