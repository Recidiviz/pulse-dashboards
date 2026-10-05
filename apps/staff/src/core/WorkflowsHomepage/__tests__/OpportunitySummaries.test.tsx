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
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { OpportunityType } from "~datatypes";

import { JusticeInvolvedPerson, Opportunity } from "../../../WorkflowsStore";
import { OpportunitySummaries } from "../OpportunitySummaries";
import { summaryFromCounts, summaryFromOpportunities } from "../summaryData";

const TYPE = "usNeGoodTimeRestoration" as OpportunityType;

const CONFIG = {
  label: "Good Time Restoration",
  urlSection: "goodTimeRestoration",
  eligibilityTextForCount: (n: number) => `${n} people are eligible`,
  highlightCasesOnHomepage: false,
  highlightedCaseCtaCopy: "highlighted cases",
  tabGroups: { "ELIGIBILITY STATUS": ["Eligible Now", "Almost Eligible"] },
};

/** Mutable so a test can flip the highlight flag the store now owns. */
const store = { config: CONFIG as Record<string, unknown> };

vi.mock("../../../components/StoreProvider", () => ({
  useFeatureVariants: () => ({}),
  useOpportunityConfigurations: () => ({ [TYPE]: store.config }),
  useRootStore: () => ({ tenantStore: { currentTenantId: "US_NE" } }),
}));

function person(name: string): JusticeInvolvedPerson {
  return {
    recordId: `r-${name}`,
    externalId: name,
    pseudonymizedId: `p-${name}`,
    displayPreferredName: `${name} Tester`,
    fullName: { givenNames: name, surname: "Tester" },
  } as unknown as JusticeInvolvedPerson;
}

function opportunity(): Opportunity {
  return {
    type: TYPE,
    person: person("FromList"),
    config: CONFIG,
    tabTitle: () => "Eligible Now",
    isSubmitted: false,
    denial: undefined,
    isIneligible: false,
  } as unknown as Opportunity;
}

beforeEach(() => {
  store.config = CONFIG;
});

function renderSummaries(props: Parameters<typeof OpportunitySummaries>[0]) {
  return render(
    <BrowserRouter>
      <OpportunitySummaries {...props} />
    </BrowserRouter>,
  );
}

/** What a presenter hands down on the hydrated-list path. */
function fromList(opportunities: Opportunity[]) {
  return {
    opportunityTypes: [TYPE],
    opportunitiesByType: { [TYPE]: opportunities },
    summaryByType: { [TYPE]: summaryFromOpportunities(opportunities) },
  };
}

describe("summarised from a hydrated list", () => {
  test("renders the card from the list's own counts", () => {
    renderSummaries(fromList([opportunity(), opportunity()]));

    expect(screen.getByText("2 people are eligible")).toBeInTheDocument();
  });

  test("renders nothing for a type with no opportunities", () => {
    renderSummaries(fromList([]));

    expect(screen.queryByText(/people are eligible/)).not.toBeInTheDocument();
  });
});

describe("summarised from a search that fetched no caseload", () => {
  // At least three people: `additionalCount` is computed from the SLOTS, not
  // from how many were supplied, so a shorter list under-reports "+N".
  const withCounts = {
    opportunityTypes: [TYPE],
    // Empty BY DESIGN: the caseload is never fetched on this path.
    opportunitiesByType: {},
    summaryByType: {
      [TYPE]: summaryFromCounts({ "Eligible Now": 12, "Almost Eligible": 3 }, [
        person("Ada"),
        person("Ben"),
        person("Cleo"),
      ]),
    },
  };

  test("renders a card from counts alone, with no opportunities at all", () => {
    renderSummaries(withCounts);

    expect(screen.getByText("15 people are eligible")).toBeInTheDocument();
  });

  test("shows the per-tab counts the census produced", () => {
    renderSummaries(withCounts);

    expect(screen.getByText(/Eligible Now/)).toBeInTheDocument();
    expect(screen.getByText(/Almost Eligible/)).toBeInTheDocument();
  });

  test("draws the avatars from the summary, not the empty list", () => {
    // Nothing else can supply them here: no opportunity exists to carry one.
    renderSummaries(withCounts);

    expect(screen.getAllByText("AT").length).toBeGreaterThan(0);
  });

  test("shows the overflow count against the census total", () => {
    // 15 counted, 3 shown — the "+N" comes off the CENSUS total, which is the
    // whole point: the page never fetched the other twelve.
    renderSummaries(withCounts);

    expect(screen.getAllByText("+ 12").length).toBeGreaterThan(0);
  });

  test("an empty count set renders no card", () => {
    renderSummaries({
      ...withCounts,
      summaryByType: { [TYPE]: summaryFromCounts({}) },
    });

    expect(screen.queryByText(/people are eligible/)).not.toBeInTheDocument();
  });

  test("a zeroed tab renders no card either", () => {
    renderSummaries({
      ...withCounts,
      summaryByType: { [TYPE]: summaryFromCounts({ "Eligible Now": 0 }) },
    });

    expect(screen.queryByText(/people are eligible/)).not.toBeInTheDocument();
  });
});

describe("as the Insights officer page calls it", () => {
  // The second caller. Its presenter derives from the hydrated list.
  const insightsProps = {
    ...fromList([opportunity(), opportunity()]),
    officerPseudoId: "officer-hashed-id",
    zeroGrantOpportunities: [TYPE as string],
  };

  test("renders the card from the list", () => {
    renderSummaries(insightsProps);

    expect(screen.getByText("2 people are eligible")).toBeInTheDocument();
  });

  test("routes to the officer's Insights page, not the Workflows one", () => {
    // `officerPseudoId` is what distinguishes the two callers' links.
    renderSummaries(insightsProps);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      expect.stringContaining("officer-hashed-id"),
    );
  });

  test("honours `highlightCasesOnHomepage` from the STORE", () => {
    // Read from the store, not a record: the counts path has none to ask.
    store.config = { ...CONFIG, highlightCasesOnHomepage: true };

    renderSummaries(insightsProps);

    expect(screen.queryByText(/people are eligible/)).not.toBeInTheDocument();
  });
});
