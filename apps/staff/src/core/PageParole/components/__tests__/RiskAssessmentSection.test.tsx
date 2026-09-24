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

import { ParoleRiskAssessment } from "~datatypes";

import type { ParoleRiskAssessmentConfig } from "../../../models/types";
import { RiskAssessmentSection } from "../RiskAssessmentSection";

const RISK_ASSESSMENTS: Array<ParoleRiskAssessment> = [
  {
    tool: "LSIR",
    level: "Low",
    score: 10,
    maxScore: 100,
    date: "2026-06-01",
    subcategories: [{ name: "Criminal History", score: 10, maxScore: 20 }],
  },
  {
    tool: "PIT",
    level: "Moderate",
    score: 45,
    maxScore: 100,
    date: "2026-06-01",
    subcategories: [{ name: "Violence History", score: 45, maxScore: 100 }],
  },
  {
    tool: "CARAS",
    level: "Medium",
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
    level: "High",
    score: 70,
    maxScore: 100,
    date: "2024-01-01",
    subcategories: [{ name: "Social Stability", score: 70, maxScore: 100 }],
  },
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
    render(<RiskAssessmentSection riskAssessments={RISK_ASSESSMENTS} />);

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
    render(<RiskAssessmentSection riskAssessments={RISK_ASSESSMENTS} />);

    await user.click(screen.getByRole("button", { name: /^LSI/ }));
    expect(screen.getByText("10 / 100")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^PIT/ }));
    expect(screen.queryByText("10 / 100")).not.toBeInTheDocument();
    expect(screen.getByText("45 / 100")).toBeInTheDocument();
  });

  it("shows the score, assessment date, a risk pill, and a subcategory breakdown chart for a selected tool", async () => {
    const user = userEvent.setup();
    render(<RiskAssessmentSection riskAssessments={RISK_ASSESSMENTS} />);

    await user.click(screen.getByRole("button", { name: /^LSI/ }));

    expect(screen.getByText("10 / 100")).toBeInTheDocument();
    expect(screen.getByText("Assessed Jun 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Low Risk — 10%")).toBeInTheDocument();
    expect(
      screen.getByText("Subcategory Breakdown (Most recent assessment)"),
    ).toBeInTheDocument();
  });

  it("labels the risk level as the source recorded it, for every tool", async () => {
    const user = userEvent.setup();
    render(<RiskAssessmentSection riskAssessments={RISK_ASSESSMENTS} />);

    await user.click(screen.getByRole("button", { name: /^PIT/ }));
    expect(screen.getByText("Moderate Risk — 45%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^SRT/ }));
    expect(screen.getByText("High Risk — 70%")).toBeInTheDocument();

    // CARAS is no longer special-cased: its level comes from the same field
    // as every other tool's, rather than from its own probability bands.
    await user.click(screen.getByRole("button", { name: /^CARAS/ }));
    expect(screen.getByText("Medium Risk — 40%")).toBeInTheDocument();
  });

  it("warns when the selected assessment is over 12 months stale", async () => {
    const user = userEvent.setup();
    render(<RiskAssessmentSection riskAssessments={RISK_ASSESSMENTS} />);

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
    render(<RiskAssessmentSection riskAssessments={[]} />);

    expect(screen.getByText("Risk Score Trajectory")).toBeInTheDocument();
    expect(
      screen.getByText("No risk assessments available for this resident."),
    ).toBeInTheDocument();
  });

  it("takes the level from the source even when the score disagrees with it", async () => {
    const user = userEvent.setup();
    // 596 / 1000 is 59.6%, which the old code would have tiered as Medium.
    // The level is the assessing tool's, so a disagreeing score changes
    // nothing.
    const mismatchedAssessments: Array<ParoleRiskAssessment> = [
      {
        tool: "LSIR",
        level: "High",
        score: 596,
        maxScore: 1000,
        date: "2026-06-01",
        subcategories: [
          { name: "Criminal History", score: 596, maxScore: 1000 },
        ],
      },
    ];

    render(<RiskAssessmentSection riskAssessments={mismatchedAssessments} />);

    await user.click(screen.getByRole("button", { name: /^LSI/ }));
    expect(screen.getByText("High Risk — 60%")).toBeInTheDocument();
  });

  it("still shows the selected tool's detail when it records no risk level", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={[
          { tool: "LSIR", score: 10, maxScore: 100, date: "2026-06-01" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^LSI/ }));

    // The score and date stand on their own; only the risk pill drops out.
    expect(screen.getByText("10 / 100")).toBeInTheDocument();
    expect(screen.getByText(/Assessed/)).toBeInTheDocument();
    expect(screen.queryByText(/\sRisk/)).not.toBeInTheDocument();
  });
});

// A tenant that supplies riskAssessmentConfig (e.g. US_CO) gets a redesigned
// display -- raw scores instead of percentages, a custom aggregate view, and
// a plain CARAS component list. Every test above renders with no config at
// all and pins that a tenant which doesn't opt in (e.g. US_ID) sees no
// behavior change from any of this.
describe("RiskAssessmentSection with a custom riskAssessmentConfig", () => {
  const CUSTOM_CONFIG: ParoleRiskAssessmentConfig = {
    tools: ["LSIR", "PIT", "CARAS", "SRT"],
    aggregateView: { label: "Entire CTAP Suite", tools: ["PIT", "SRT"] },
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 6, 15));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows raw scores instead of percentages in the legend and risk pill", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskAssessmentConfig={CUSTOM_CONFIG}
      />,
    );

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.queryByText("10%")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^LSI/ }));
    expect(screen.getByText("Low Risk")).toBeInTheDocument();
    expect(screen.queryByText(/Low Risk —/)).not.toBeInTheDocument();
  });

  it("renders the configured aggregate view label and tool subset", () => {
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskAssessmentConfig={CUSTOM_CONFIG}
      />,
    );

    expect(screen.getAllByText("Entire CTAP Suite").length).toBeGreaterThan(0);
    expect(screen.getByText("2 assessment types selected")).toBeInTheDocument();
  });

  it("shows a raw-score trajectory subtitle for a selected tool", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskAssessmentConfig={CUSTOM_CONFIG}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^LSI/ }));
    expect(
      screen.getByText("Trajectory out of a maximum of 100 points"),
    ).toBeInTheDocument();
  });

  it("renders CARAS as a plain component list instead of a bar chart", async () => {
    const user = userEvent.setup();
    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskAssessmentConfig={CUSTOM_CONFIG}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^CARAS/ }));
    expect(
      screen.getByText("Individual Components of the CARAS"),
    ).toBeInTheDocument();
    expect(screen.getByText("Offender Age")).toBeInTheDocument();
    expect(
      screen.queryByText("Subcategory Breakdown (Most recent assessment)"),
    ).not.toBeInTheDocument();
  });

  it("only renders tools included in the config, hiding any others present in the data", () => {
    const narrowConfig: ParoleRiskAssessmentConfig = {
      tools: ["LSIR", "PIT"],
      aggregateView: { label: "Entire CTAP Suite", tools: ["LSIR", "PIT"] },
    };

    render(
      <RiskAssessmentSection
        riskAssessments={RISK_ASSESSMENTS}
        riskAssessmentConfig={narrowConfig}
      />,
    );

    expect(screen.getByRole("button", { name: /^LSI/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^SRT/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^CARAS/ }),
    ).not.toBeInTheDocument();
  });
});
