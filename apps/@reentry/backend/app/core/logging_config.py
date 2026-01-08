import logging
import sys

import structlog
import structlog_gcp
from structlog_sentry import SentryProcessor


def setup_stdlib_logging() -> None:
    if not sys.stderr.isatty():
        # In GCP: Just output the JSON message without extra formatting
        logging.basicConfig(
            format="%(message)s",
            level=logging.INFO,
        )
    else:
        # In local dev: Keep the readable format for console output
        logging.basicConfig(
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            level=logging.INFO,
        )


def setup_structlog() -> None:
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        SentryProcessor(
            level=logging.INFO,
            event_level=logging.ERROR,
        ),
        structlog.processors.format_exc_info,
    ]

    if not sys.stderr.isatty():
        gcp_processors = structlog_gcp.build_processors(service="action-plan-generator")
        if gcp_processors:
            processors.extend(gcp_processors)
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def setup_logging() -> None:
    setup_stdlib_logging()
    setup_structlog()
