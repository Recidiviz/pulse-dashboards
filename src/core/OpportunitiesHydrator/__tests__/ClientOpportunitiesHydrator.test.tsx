/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
import { render, screen } from "@testing-library/react";

import { useRootStore } from "../../../components/StoreProvider";
import { SelectedPersonOpportunitiesHydrator } from "../SelectedPersonOpportunitiesHydrator";

jest.mock("../../../components/StoreProvider");
const useRootStoreMock = useRootStore as jest.Mock;

let lsuHydrateMock: typeof jest.fn;
let pastFTRDHydrateMock: typeof jest.fn;

const empty = <div>Empty!</div>;
const hydrated = <div>Hydrated!</div>;

beforeEach(() => {
  jest.resetAllMocks();
});

const setUp = ({
  lsuLoading = false,
  pastFTRDLoading = false,
  lsuVerified = true,
  pastFTRDVerified = true,
  lsuHydrated = true,
  pastFTRDHydrated = true,
}) => {
  lsuHydrateMock = jest.fn();
  pastFTRDHydrateMock = jest.fn();
  const mockRoot = {
    workflowsStore: {
      selectedClient: {
        potentialOpportunities: {
          LSU: {
            hydrate: lsuHydrateMock,
            isLoading: lsuLoading,
            isHydrated: lsuHydrated,
          },
          pastFTRD: {
            hydrate: pastFTRDHydrateMock,
            isLoading: pastFTRDLoading,
            isHydrated: pastFTRDHydrated,
          },
        },
        verifiedOpportunities: {},
      },
    },
  };
  if (lsuVerified) {
    // @ts-ignore
    mockRoot.workflowsStore.selectedClient.verifiedOpportunities.LSU = {
      isLoading: lsuLoading,
      isHydrated: lsuHydrated,
    };
  }
  if (pastFTRDVerified) {
    // @ts-ignore
    mockRoot.workflowsStore.selectedClient.verifiedOpportunities.pastFTRD = {
      isLoading: pastFTRDLoading,
      isHydrated: pastFTRDHydrated,
    };
  }
  useRootStoreMock.mockReturnValue(mockRoot);
};

const expectStateToBe = (expectedState: "HYDRATED" | "EMPTY" | "LOADING") => {
  // eslint-disable-next-line default-case
  switch (expectedState) {
    case "LOADING":
      expect(
        screen.queryByText("Loading", { exact: false })
      ).toBeInTheDocument();
      expect(screen.queryByText("Empty!")).not.toBeInTheDocument();
      expect(screen.queryByText("Hydrated!")).not.toBeInTheDocument();
      break;
    case "EMPTY":
      expect(
        screen.queryByText("Loading", { exact: false })
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Empty!")).toBeInTheDocument();
      expect(screen.queryByText("Hydrated!")).not.toBeInTheDocument();
      break;
    case "HYDRATED":
      expect(
        screen.queryByText("Loading", { exact: false })
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Empty!")).not.toBeInTheDocument();
      expect(screen.queryByText("Hydrated!")).toBeInTheDocument();
      break;
  }
};

describe("ClientOpportunityHydrator tests", () => {
  it("calls hydrate on all specified opportunities", () => {
    setUp({});

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
      />
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
      />
    );

    expect(lsuHydrateMock).toHaveBeenCalled();
    expect(pastFTRDHydrateMock).not.toHaveBeenCalled();
  });

  it("renders loading state if loading is not complete", () => {
    setUp({ lsuLoading: true, pastFTRDLoading: true });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
      />
    );

    expectStateToBe("LOADING");
  });

  it("renders loading state if one is loaded and the other is not", () => {
    setUp({ lsuLoading: true });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
      />
    );

    expectStateToBe("LOADING");
  });

  it("renders hydrated state when all opportunities are hydrated", () => {
    setUp({});

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
      />
    );

    expectStateToBe("HYDRATED");
  });

  it("renders hydrated state only based on specified opportunities", () => {
    setUp({ lsuLoading: true });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["pastFTRD"]}
      />
    );

    expectStateToBe("HYDRATED");
  });

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
      />
    );

    expectStateToBe("EMPTY");
  });

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
      />
    );

    expectStateToBe("EMPTY");
  });

  it("exits loading state even if hydration fails", () => {
    setUp({
      lsuHydrated: false,
      pastFTRDHydrated: false,
      lsuVerified: false,
      pastFTRDVerified: false,
    });

    render(
      <SelectedPersonOpportunitiesHydrator
        hydrated={hydrated}
        empty={empty}
        opportunityTypes={["LSU", "pastFTRD"]}
      />
    );

    expectStateToBe("EMPTY");
  });
});
