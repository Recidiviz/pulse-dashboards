#!/usr/bin/env python3
"""Analyze feedback CSV to produce summary statistics.

Usage:
    python scripts/analyze_feedback_csv.py --input /tmp/feedback_review.csv
"""

import argparse
import csv
from collections import defaultdict


def analyze_feedback(input_path: str):
    """Analyze feedback CSV and print summary statistics.

    Uses "effective severity": if override is present, use it; otherwise use original severity.
    """

    # Track issues per plan (intake_id)
    # Each plan gets a set of (component, section, criterion) tuples that have issues
    plans_mild_issues = defaultdict(set)  # intake_id -> set of issue keys
    plans_severe_issues = defaultdict(set)
    all_plans = set()

    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            intake_id = row["intake_id"]
            all_plans.add(intake_id)

            severity = row.get("severity", "").strip().lower()
            override = row.get("override", "").strip().lower()

            # Use effective severity: override if present, otherwise original
            effective_severity = override if override else severity

            # Create a unique key for this issue type
            issue_key = (row["component"], row["section"], row["criterion"])

            if effective_severity == "mild":
                plans_mild_issues[intake_id].add(issue_key)
            elif effective_severity == "severe":
                plans_severe_issues[intake_id].add(issue_key)

    total_plans = len(all_plans)

    if total_plans == 0:
        print("No plans found in CSV")
        return

    # Calculate statistics
    plans_with_mild = len([p for p in all_plans if len(plans_mild_issues[p]) > 0])
    plans_with_severe = len([p for p in all_plans if len(plans_severe_issues[p]) > 0])

    total_mild_issues = sum(len(plans_mild_issues[p]) for p in all_plans)
    total_severe_issues = sum(len(plans_severe_issues[p]) for p in all_plans)

    avg_mild_per_plan = total_mild_issues / total_plans
    avg_severe_per_plan = total_severe_issues / total_plans

    # Print results
    print("=" * 60)
    print("FEEDBACK ANALYSIS SUMMARY")
    print("=" * 60)
    print()
    print("(Using effective severity: override if present, else original)")
    print()
    print(f"1) Total plans reviewed:                    {total_plans}")
    print(f"2) Plans with at least one mild issue:     {plans_with_mild} ({100*plans_with_mild/total_plans:.1f}%)")
    print(f"3) Plans with at least one severe issue:   {plans_with_severe} ({100*plans_with_severe/total_plans:.1f}%)")
    print(f"4) Avg mild issues per plan:               {avg_mild_per_plan:.2f}")
    print(f"5) Avg severe issues per plan:             {avg_severe_per_plan:.2f}")
    print()
    print("=" * 60)

    # Also show breakdown by component
    print()
    print("ISSUES BY COMPONENT")
    print("-" * 40)

    component_mild = defaultdict(int)
    component_severe = defaultdict(int)

    for intake_id in all_plans:
        for (component, section, criterion) in plans_mild_issues[intake_id]:
            component_mild[component] += 1
        for (component, section, criterion) in plans_severe_issues[intake_id]:
            component_severe[component] += 1

    for component in sorted(set(list(component_mild.keys()) + list(component_severe.keys()))):
        print(f"  {component}: {component_mild[component]} mild, {component_severe[component]} severe")


def main():
    parser = argparse.ArgumentParser(description="Analyze feedback CSV")
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Input CSV file path"
    )

    args = parser.parse_args()
    analyze_feedback(args.input)


if __name__ == "__main__":
    main()
