#!/usr/bin/env python3
"""
Manage the labeling user allowlist.

Each user entry has two independent settings:
  full_queue   — whether they see their entire intake queue (vs. the default single-intake view)
  state_codes  — optionally restrict which states' intakes are shown (applies regardless of full_queue)

Usage:
    uv run python scripts/manage_allowlist.py list
    uv run python scripts/manage_allowlist.py add user@recidiviz.org
    uv run python scripts/manage_allowlist.py remove user@recidiviz.org
    uv run python scripts/manage_allowlist.py set user@recidiviz.org --full-queue on
    uv run python scripts/manage_allowlist.py set user@recidiviz.org --full-queue off
    uv run python scripts/manage_allowlist.py set user@recidiviz.org --states US_CA,US_TX
    uv run python scripts/manage_allowlist.py set user@recidiviz.org --clear-states
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models.user_allowlist import LabelingUserAllowlist


def create_labeling_engine():
    """Create engine for labeling database."""
    labeling_url = (
        f"postgresql://{settings.labeling_postgres_user}:{settings.labeling_postgres_password}"
        f"@{settings.labeling_postgres_server}:{settings.labeling_postgres_port}"
        f"/{settings.labeling_postgres_db}"
    )
    return create_engine(labeling_url)


def cmd_list(session):
    """List all users on the allowlist."""
    entries = session.query(LabelingUserAllowlist).order_by(LabelingUserAllowlist.email).all()
    if not entries:
        print("No users on the allowlist.")
        return
    print(f"{'Email':<50} {'Full Queue':<12} {'States'}")
    print("-" * 80)
    for entry in entries:
        states = ",".join(entry.state_codes) if entry.state_codes else "(all states)"
        full_queue = "yes" if entry.full_queue else "no"
        print(f"{entry.email:<50} {full_queue:<12} {states}")


def cmd_add(session, email: str, full_queue: str | None, states: str | None):
    """Add a user to the allowlist (or update if already exists)."""
    existing = session.query(LabelingUserAllowlist).filter_by(email=email).first()
    fq = (full_queue == "on") if full_queue is not None else False
    sc = [s.strip() for s in states.split(",") if s.strip()] if states else None

    if existing:
        existing.full_queue = fq if full_queue is not None else existing.full_queue
        existing.state_codes = sc if states is not None else existing.state_codes
        existing.updated_at = datetime.now(timezone.utc)
        session.commit()
        print(f"Updated {email}: full_queue={'on' if existing.full_queue else 'off'}, states={','.join(existing.state_codes) if existing.state_codes else 'all'}")
    else:
        entry = LabelingUserAllowlist(
            id=uuid4(),
            email=email,
            full_queue=fq,
            state_codes=sc,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(entry)
        session.commit()
        print(f"Added {email}: full_queue={'on' if fq else 'off'}, states={','.join(sc) if sc else 'all'}")


def cmd_remove(session, email: str):
    """Remove a user from the allowlist."""
    entry = session.query(LabelingUserAllowlist).filter_by(email=email).first()
    if not entry:
        print(f"{email} is not on the allowlist.")
        return
    session.delete(entry)
    session.commit()
    print(f"Removed {email}.")


def cmd_set(session, email: str, full_queue: str | None, states: str | None, clear_states: bool):
    """Update settings for a user. Creates the entry if it doesn't exist."""
    entry = session.query(LabelingUserAllowlist).filter_by(email=email).first()
    if not entry:
        entry = LabelingUserAllowlist(
            id=uuid4(),
            email=email,
            full_queue=False,
            state_codes=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(entry)
        print(f"Created new entry for {email}.")

    changed = []

    if full_queue is not None:
        if full_queue not in ("on", "off"):
            print("Error: --full-queue must be 'on' or 'off'", file=sys.stderr)
            sys.exit(1)
        entry.full_queue = full_queue == "on"
        changed.append(f"full_queue={'on' if entry.full_queue else 'off'}")

    if clear_states:
        entry.state_codes = None
        changed.append("states=all")
    elif states is not None:
        entry.state_codes = [s.strip() for s in states.split(",") if s.strip()]
        changed.append(f"states={','.join(entry.state_codes)}")

    if not changed:
        print("No changes specified. Use --full-queue and/or --states/--clear-states.")
        return

    entry.updated_at = datetime.now(timezone.utc)
    session.commit()
    print(f"Updated {email}: {', '.join(changed)}")


def main():
    parser = argparse.ArgumentParser(
        description="Manage the labeling user allowlist.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("list", help="List all allowlisted users and their settings")

    add_parser = subparsers.add_parser("add", help="Add a user (or update if already exists)")
    add_parser.add_argument("email", help="User's email address")
    add_parser.add_argument(
        "--full-queue",
        dest="full_queue",
        choices=["on", "off"],
        default=None,
        help="Enable or disable full queue view",
    )
    add_parser.add_argument(
        "--states",
        default=None,
        help="Comma-separated state codes to restrict to (e.g. US_CA,US_TX)",
    )

    remove_parser = subparsers.add_parser("remove", help="Remove a user from the allowlist")
    remove_parser.add_argument("email", help="User's email address")

    set_parser = subparsers.add_parser("set", help="Update settings for a user")
    set_parser.add_argument("email", help="User's email address")
    set_parser.add_argument(
        "--full-queue",
        dest="full_queue",
        choices=["on", "off"],
        default=None,
        help="Enable or disable full queue view",
    )
    set_parser.add_argument(
        "--states",
        default=None,
        help="Comma-separated state codes to restrict to (e.g. US_CA,US_TX)",
    )
    set_parser.add_argument(
        "--clear-states",
        dest="clear_states",
        action="store_true",
        help="Remove state restrictions (show all states)",
    )

    args = parser.parse_args()

    engine = create_labeling_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        if args.command == "list":
            cmd_list(session)
        elif args.command == "add":
            cmd_add(session, args.email, args.full_queue, args.states)
        elif args.command == "remove":
            cmd_remove(session, args.email)
        elif args.command == "set":
            cmd_set(session, args.email, args.full_queue, args.states, args.clear_states)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        session.rollback()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
