// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ParoleRiskAssessment, ParoleRiskOverviewPoint } from "~datatypes";

import { RiskAssessmentSection } from "../RiskAssessmentSection";

const RISK_ASSESSMENTS: Array<ParoleRiskAssessment> = [
  {
    tool: "LSI",
    score: 10,
    maxScore: 100,
    date: "2026-06-01",
    subcategories: [{ name: "Criminal History", score: 10, maxScore: 20 }],
  },
  {
    tool: "PIT",
    score: 45,
    maxScore: 100,
    date: "2026-06-01",
    subcategories: [{ name: "Violence History", score: 45, maxScore: 100 }],
  },
  {
    tool: "CARAS",
    score: 40,
    maxScore: 100,
    date: "2026-06-01",
    carasFactors: [
      { name: "Offender Age", value: 30, coefficient: -0.03 },
      { name: "Prior Case Count", value: 2, coefficient: 0.08 },
    ],
  },
  {
    // Stale: dated well over 12 months before "now" (2026-07-15, set below).
    tool: "SRT",
    score: 70,
    maxScore: 100,
    date: "2024-01-01",
    subcategories: [{ name: "Social Stability", score: 70, maxScore: 100 }],
  },
];

const RISK_OVERVIEW_HISTORY: Array<ParoleRiskOverviewPoint> = [
  { date: "2025-01-01", LSI: 20, PIT: 55 },
  { date: "2026-06-01", LSI: 10, PIT: 45, CARAS: 40, SRT: 70 },
];

describe("RiskAssessmentSection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to the 'All' view with a trajectory chart of all assessments", () => {
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskOverviewHistory={RISK_OVERVIEW_HISTORY}
      />,
    );

    expect(screen.getByText("Risk Score Trajectory")).toBeInTheDocument();
    expect(
      screen.getByText("Trajectory - percent of max scores"),
    ).toBeInTheDocument();
    expect(screen.getByText("All assessments")).toBeInTheDocument();
    expect(screen.getByText("4 assessment types selected")).toBeInTheDocument();
    expect(
      screen.queryByText("Subcategory Breakdown (Most recent assessment)"),
    ).not.toBeInTheDocument();
  });

  it("only allows a single assessment tool to be selected at a time", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskOverviewHistory={RISK_OVERVIEW_HISTORY}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^LSI/ }));
    expect(screen.getByText("10 / 100")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^PIT/ }));
    expect(screen.queryByText("10 / 100")).not.toBeInTheDocument();
    expect(screen.getByText("45 / 100")).toBeInTheDocument();
  });

  it("shows the score, assessment date, a risk pill, and a subcategory breakdown chart for a selected tool", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskOverviewHistory={RISK_OVERVIEW_HISTORY}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^LSI/ }));

    expect(screen.getByText("10 / 100")).toBeInTheDocument();
    expect(screen.getByText("Assessed Jun 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Low Risk — 10%")).toBeInTheDocument();
    expect(
      screen.getByText("Subcategory Breakdown (Most recent assessment)"),
    ).toBeInTheDocument();
  });

  it("labels risk levels using the generic tool thresholds", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskOverviewHistory={RISK_OVERVIEW_HISTORY}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^PIT/ }));
    expect(screen.getByText("Medium Risk — 45%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^SRT/ }));
    expect(screen.getByText("High Risk — 70%")).toBeInTheDocument();
  });

  it("labels CARAS risk levels using its own probability bands instead of the generic thresholds", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskOverviewHistory={RISK_OVERVIEW_HISTORY}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^CARAS/ }));
    // A CARAS score of 40 (probability 0.40) falls in the Medium band
    // (0.3854, 0.5139], not the generic tool's 30-59% Medium band by
    // coincidence -- this assertion pins the CARAS-specific thresholds.
    expect(screen.getByText("Medium Risk — 40%")).toBeInTheDocument();
  });

  it("warns when the selected assessment is over 12 months stale", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskOverviewHistory={RISK_OVERVIEW_HISTORY}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^SRT/ }));
    expect(
      screen.getByText("Last assessment over 12 months ago"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^LSI/ }));
    expect(
      screen.queryByText("Last assessment over 12 months ago"),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no risk assessments", () => {
    render(
      <RiskAssessmentSection riskAssessments={[]} riskOverviewHistory={[]} />,
    );

    expect(screen.getByText("Risk Score Trajectory")).toBeInTheDocument();
    expect(
      screen.getByText("No risk assessments available for this resident."),
    ).toBeInTheDocument();
  });

  it("determines risk level from the unrounded percentage, not the rounded display value", async () => {
    const user = userEvent.setup();
    // 596 / 1000 = 59.6%, which rounds to 60% for display but stays under
    // the 60% "High" threshold when the risk level is computed from the raw
    // value -- pins that rounding must not flip the risk tier.
    const borderlineAssessments: Array<ParoleRiskAssessment> = [
      {
        tool: "LSI",
        score: 596,
        maxScore: 1000,
        date: "2026-06-01",
        subcategories: [
          { name: "Criminal History", score: 596, maxScore: 1000 },
        ],
      },
    ];

    render(
      <RiskAssessmentSection
        riskAssessments={borderlineAssessments}
        riskOverviewHistory={RISK_OVERVIEW_HISTORY}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^LSI/ }));
    expect(screen.getByText("Medium Risk — 60%")).toBeInTheDocument();
  });
});
