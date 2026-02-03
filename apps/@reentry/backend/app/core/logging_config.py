import logging
import sys

import structlog
import structlog_gcp
from structlog_sentry import SentryProcessor


def setup_logging() -> None:
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    # Determine the final renderer based on environment
    if not sys.stderr.isatty():
        # GCP: Use JSON rendering for structured logs
        gcp_processors = structlog_gcp.build_processors(service="action-plan-generator")
        if gcp_processors:
            # structlog_gcp provides its own renderer
            renderer = (
                gcp_processors[-1]
                if gcp_processors
                else structlog.processors.JSONRenderer()
            )
        else:
            renderer = structlog.processors.JSONRenderer()
    else:
        # Local dev: Use console rendering for readability
        renderer = structlog.dev.ConsoleRenderer()

    # Configure structlog with ProcessorFormatter integration
    structlog.configure(
        processors=[
            *shared_processors,
            SentryProcessor(
                level=logging.INFO,
                event_level=logging.ERROR,
            ),
            structlog.processors.format_exc_info,
            # Wrap for ProcessorFormatter instead of rendering directly
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard library logging with ProcessorFormatter
    # This routes ALL standard library logs (socketio, uvicorn, etc.) through structlog
    formatter = structlog.stdlib.ProcessorFormatter(
        # Foreign logs (from third-party libraries) go through this chain first
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
