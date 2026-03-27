#!/usr/bin/env python3
"""Export feedback from specified evaluators to CSV for review.

Usage:
    python scripts/export_feedback_csv.py --evaluators "email1,email2,email3" --output /tmp/feedback.csv
"""

import argparse
import asyncio
import csv
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


async def get_labeling_db_url() -> str:
    """Get the labeling database URL from environment."""
    host = os.environ.get("LABELING_LABELING_POSTGRES_HOST", "localhost")
    port = os.environ.get("LABELING_LABELING_POSTGRES_PORT", "5432")
    user = os.environ.get("LABELING_LABELING_POSTGRES_USER", "postgres")
    password = os.environ.get("LABELING_LABELING_POSTGRES_PASSWORD", "postgres")
    db = os.environ.get("LABELING_LABELING_POSTGRES_DB", "labeling")
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"


async def get_reentry_db_url() -> str:
    """Get the reentry database URL from environment."""
    host = os.environ.get("LABELING_REENTRY_POSTGRES_HOST", "localhost")
    port = os.environ.get("LABELING_REENTRY_POSTGRES_PORT", "5432")
    user = os.environ.get("LABELING_REENTRY_POSTGRES_USER", "postgres")
    password = os.environ.get("LABELING_REENTRY_POSTGRES_PASSWORD", "postgres")
    db = os.environ.get("LABELING_REENTRY_POSTGRES_DB", "reentry")
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"


def extract_feedback_rows(feedback) -> list[dict]:
    """Extract individual feedback items from a feedback record into rows."""
    rows = []
    base_info = {
        "feedback_id": str(feedback.id),
        "intake_id": str(feedback.intake_id),
        "evaluator": feedback.evaluator,
        "created_at": feedback.created_at.isoformat() if feedback.created_at else "",
        "updated_at": feedback.updated_at.isoformat() if feedback.updated_at else "",
    }

    # Helper to add a row if there's actual feedback
    def add_row(component: str, section: str, criterion: str, severity, notes):
        if severity is not None or notes:
            rows.append({
                **base_info,
                "component": component,
                "section": section,
                "criterion": criterion,
                "severity": severity or "",
                "notes": notes or "",
                "override": "",  # Empty for user to fill in
                "override_notes": "",  # Empty for user to fill in
            })

    # Transcript feedback
    if feedback.transcript_detail_feedback:
        tf = feedback.transcript_detail_feedback
        transcript_criteria = [
            "danger_indication", "toxic_language", "inappropriate_topic",
            "user_frustration", "major_output_error", "chatbot_misunderstanding",
            "looping_questions", "skipping_questions", "other",
            "audio_quality", "transcription_quality"
        ]
        for criterion in transcript_criteria:
            if criterion in tf and isinstance(tf[criterion], dict):
                add_row(
                    "Transcript", "General", criterion,
                    tf[criterion].get("severity"),
                    tf[criterion].get("notes")
                )

    # Summary feedback (overall) - from columns
    add_row("Summary", "Overall", "factual", feedback.summary_factual_severity, feedback.summary_factual_notes)
    add_row("Summary", "Overall", "tone", feedback.summary_tone_severity, feedback.summary_tone_notes)
    add_row("Summary", "Overall", "other", feedback.summary_other_severity, feedback.summary_other_notes)

    # Summary detail feedback
    if feedback.summary_detail_feedback:
        sdf = feedback.summary_detail_feedback

        # Needs & Risks Overview categories
        if "needs_risks_overview" in sdf:
            for category, cat_feedback in sdf["needs_risks_overview"].items():
                if isinstance(cat_feedback, dict):
                    for issue_type in ["facts_incorrect", "facts_missing", "tone_issues", "other"]:
                        if issue_type in cat_feedback and isinstance(cat_feedback[issue_type], dict):
                            add_row(
                                "Summary", f"Needs & Risks - {category}", issue_type,
                                cat_feedback[issue_type].get("severity"),
                                cat_feedback[issue_type].get("notes")
                            )

        # Priority Needs
        if "priority_needs" in sdf and isinstance(sdf["priority_needs"], dict):
            for issue_type in ["needs_not_justified", "needs_missing", "other"]:
                if issue_type in sdf["priority_needs"] and isinstance(sdf["priority_needs"][issue_type], dict):
                    add_row(
                        "Summary", "Priority Needs", issue_type,
                        sdf["priority_needs"][issue_type].get("severity"),
                        sdf["priority_needs"][issue_type].get("notes")
                    )

        # Longer-term Needs
        if "longer_term_needs" in sdf and isinstance(sdf["longer_term_needs"], dict):
            for issue_type in ["needs_not_justified", "needs_missing", "other"]:
                if issue_type in sdf["longer_term_needs"] and isinstance(sdf["longer_term_needs"][issue_type], dict):
                    add_row(
                        "Summary", "Longer-term Needs", issue_type,
                        sdf["longer_term_needs"][issue_type].get("severity"),
                        sdf["longer_term_needs"][issue_type].get("notes")
                    )

        # Final Thoughts
        if "final_thoughts" in sdf and isinstance(sdf["final_thoughts"], dict):
            for issue_type in ["statements_not_supported", "other"]:
                if issue_type in sdf["final_thoughts"] and isinstance(sdf["final_thoughts"][issue_type], dict):
                    add_row(
                        "Summary", "Final Thoughts", issue_type,
                        sdf["final_thoughts"][issue_type].get("severity"),
                        sdf["final_thoughts"][issue_type].get("notes")
                    )

    # Plan detail feedback
    if feedback.plan_detail_feedback and "sections" in feedback.plan_detail_feedback:
        for section_name, section_feedback in feedback.plan_detail_feedback["sections"].items():
            if isinstance(section_feedback, dict):
                for issue_type in ["recommendation_groundedness", "unsound_recommendation",
                                   "obvious_incoherence", "missing_incomplete_sections", "other"]:
                    if issue_type in section_feedback and isinstance(section_feedback[issue_type], dict):
                        add_row(
                            "Plan", section_name, issue_type,
                            section_feedback[issue_type].get("severity"),
                            section_feedback[issue_type].get("notes")
                        )

    # Overall notes
    if feedback.overall_notes:
        rows.append({
            **base_info,
            "component": "Overall",
            "section": "",
            "criterion": "overall_notes",
            "severity": "",
            "notes": feedback.overall_notes,
            "override": "",
            "override_notes": "",
        })

    return rows


async def export_feedback(evaluators: list[str], output_path: str):
    """Export feedback from specified evaluators to CSV."""
    from app.models.labeling_feedback import LabelingFeedback

    labeling_url = await get_labeling_db_url()
    engine = create_async_engine(labeling_url)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    all_rows = []

    async with Session() as session:
        result = await session.execute(
            select(LabelingFeedback)
            .where(LabelingFeedback.evaluator.in_(evaluators))
            .order_by(LabelingFeedback.created_at.asc())
        )
        feedback_records = result.scalars().all()

        print(f"Found {len(feedback_records)} feedback records from {len(evaluators)} evaluators")

        for fb in feedback_records:
            rows = extract_feedback_rows(fb)
            all_rows.extend(rows)

    await engine.dispose()

    # Write CSV
    if all_rows:
        fieldnames = [
            "intake_id", "evaluator", "created_at", "component", "section",
            "criterion", "severity", "notes", "override", "override_notes"
        ]

        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(all_rows)

        print(f"Wrote {len(all_rows)} rows to {output_path}")
    else:
        print("No feedback rows found")


def main():
    parser = argparse.ArgumentParser(description="Export feedback to CSV")
    parser.add_argument(
        "--evaluators", "-e",
        required=True,
        help="Comma-separated list of evaluator emails"
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="Output CSV file path"
    )

    args = parser.parse_args()
    evaluators = [e.strip() for e in args.evaluators.split(",")]

    print(f"Exporting feedback from: {evaluators}")
    asyncio.run(export_feedback(evaluators, args.output))


if __name__ == "__main__":
    main()
