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

import {
  JusticeInvolvedPerson,
  OpportunityMapping,
} from "../../../WorkflowsStore/";
import { SelectedPersonOpportunitiesHydrator } from "../SelectedPersonOpportunitiesHydrator";

vi.mock("../../../components/StoreProvider");

const setSelectedOpportunityTypesMock = vi.fn();
let testSelectedPerson: JusticeInvolvedPerson;
const defaultHydrationState: HydrationState = { status: "hydrated" };

const empty = <div>Empty!</div>;
const hydrated = <div>Hydrated!</div>;

beforeEach(() => {
  vi.resetAllMocks();
});

const setUp = ({
  oppManagerHydrationState = defaultHydrationState,
  opportunitiesNotEmpty = true,
}: {
  oppManagerHydrationState?: HydrationState;
  opportunitiesNotEmpty?: boolean;
}) => {
  testSelectedPerson = {
    opportunityManager: {
      hydrationState: oppManagerHydrationState,
      setSelectedOpportunityTypes: setSelectedOpportunityTypesMock,
    },
    opportunities: {},
  } as any as JusticeInvolvedPerson;
  if (opportunitiesNotEmpty) {
    // @ts-ignore
    testSelectedPerson.opportunities = {
      LSU: {
        hydrationState: defaultHydrationState,
      },
    } as any as OpportunityMapping;
  }
};

const expectStateToBe = (expectedState: "HYDRATED" | "EMPTY" | "LOADING") => {
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
  it("calls update active opportunities on all specified opportunities", () => {
    setUp({});

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
        person={testSelectedPerson}
      />,
    );

    expect(setSelectedOpportunityTypesMock).toHaveBeenCalledExactlyOnceWith([
      "LSU",
      "pastFTRD",
    ]);
  });

  // eslint-disable-next-line vitest/expect-expect
  it("renders loading state if loading is not complete", () => {
    setUp({
      oppManagerHydrationState: { status: "loading" },
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
  it("renders empty state if no results", () => {
    setUp({
      opportunitiesNotEmpty: false,
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
  it("exits loading state even if hydration fails", () => {
    setUp({
      oppManagerHydrationState: { status: "failed" } as HydrationState,
      opportunitiesNotEmpty: false,
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
