// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { HydrationState } from "~hydration-utils";

import { JusticeInvolvedPerson } from "../../../WorkflowsStore/";
import { SelectedPersonOpportunitiesHydrator } from "../SelectedPersonOpportunitiesHydrator";

vi.mock("../../../components/StoreProvider");

const lsuHydrateMock = vi.fn();
const pastFTRDHydrateMock = vi.fn();
let testSelectedPerson: JusticeInvolvedPerson;
const defaultHydrationState: HydrationState = { status: "hydrated" };

const empty = <div>Empty!</div>;
const hydrated = <div>Hydrated!</div>;

beforeEach(() => {
  vi.resetAllMocks();
});

const setUp = ({
  lsuHydrationState = defaultHydrationState,
  pastFTRDHydrationState = defaultHydrationState,
  lsuVerified = true,
  pastFTRDVerified = true,
}: {
  lsuHydrationState?: HydrationState;
  pastFTRDHydrationState?: HydrationState;
  lsuVerified?: boolean;
  pastFTRDVerified?: boolean;
}) => {
  testSelectedPerson = {
    potentialOpportunities: {
      LSU: {
        hydrate: lsuHydrateMock,
        hydrationState: lsuHydrationState,
      },
      pastFTRD: {
        hydrate: pastFTRDHydrateMock,
        hydrationState: pastFTRDHydrationState,
      },
    },
    verifiedOpportunities: {},
  } as any as JusticeInvolvedPerson;
  if (lsuVerified) {
    // @ts-ignore
    testSelectedPerson.verifiedOpportunities.LSU = {
      hydrationState: lsuHydrationState,
    };
  }
  if (pastFTRDVerified) {
    // @ts-ignore
    testSelectedPerson.verifiedOpportunities.pastFTRD = {
      hydrationState: pastFTRDHydrationState,
    };
  }
};

const expectStateToBe = (expectedState: "HYDRATED" | "EMPTY" | "LOADING") => {
  // eslint-disable-next-line default-case
  switch (expectedState) {
    case "LOADING":
      expect(
        screen.queryByText("Loading", { exact: false }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Empty!")).not.toBeInTheDocument();
      expect(screen.queryByText("Hydrated!")).not.toBeInTheDocument();
      break;
    case "EMPTY":
      expect(
        screen.queryByText("Loading", { exact: false }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Empty!")).toBeInTheDocument();
      expect(screen.queryByText("Hydrated!")).not.toBeInTheDocument();
      break;
    case "HYDRATED":
      expect(
        screen.queryByText("Loading", { exact: false }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Empty!")).not.toBeInTheDocument();
      expect(screen.queryByText("Hydrated!")).toBeInTheDocument();
      break;
  }
};

describe("SelectedPersonOpportunityHydrator tests", () => {
  it("calls hydrate on all specified opportunities", () => {
    setUp({});

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expect(lsuHydrateMock).toHaveBeenCalled();
    expect(pastFTRDHydrateMock).toHaveBeenCalled();
  });

  it("calls hydrate only on specified opportunities", () => {
    setUp({});

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU"]}
        person={testSelectedPerson}
      />,
    );

    expect(lsuHydrateMock).toHaveBeenCalled();
    expect(pastFTRDHydrateMock).not.toHaveBeenCalled();
  });

  // eslint-disable-next-line vitest/expect-expect
  it("renders loading state if loading is not complete", () => {
    setUp({
      lsuHydrationState: { status: "loading" },
      pastFTRDHydrationState: { status: "loading" },
    });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expectStateToBe("LOADING");
  });

  // eslint-disable-next-line vitest/expect-expect
  it("renders loading state if one is loaded and the other is not", () => {
    setUp({ lsuHydrationState: { status: "loading" } });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expectStateToBe("LOADING");
  });

  // eslint-disable-next-line vitest/expect-expect
  it("renders hydrated state when all opportunities are hydrated", () => {
    setUp({});

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expectStateToBe("HYDRATED");
  });

  // eslint-disable-next-line vitest/expect-expect
  it("renders hydrated state only based on specified opportunities", () => {
    setUp({ lsuHydrationState: { status: "loading" } });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expectStateToBe("HYDRATED");
  });

  // eslint-disable-next-line vitest/expect-expect
  it("renders empty state if no results", () => {
    setUp({
      lsuVerified: false,
      pastFTRDVerified: false,
    });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expectStateToBe("EMPTY");
  });

  // eslint-disable-next-line vitest/expect-expect
  it("only renders empty state based on specified opportunities", () => {
    setUp({
      lsuVerified: false,
      pastFTRDVerified: true,
    });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU"]}
        person={testSelectedPerson}
      />,
    );

    expectStateToBe("EMPTY");
  });

  // eslint-disable-next-line vitest/expect-expect
  it("exits loading state even if hydration fails", () => {
    setUp({
      lsuHydrationState: { status: "failed" } as HydrationState,
      pastFTRDHydrationState: { status: "failed" } as HydrationState,
      lsuVerified: false,
      pastFTRDVerified: false,
    });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expectStateToBe("EMPTY");
  });
});
