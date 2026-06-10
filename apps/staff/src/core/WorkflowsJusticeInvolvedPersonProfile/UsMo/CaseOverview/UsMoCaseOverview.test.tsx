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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { parseISO } from "date-fns";
import React from "react";
import tk from "timekeeper";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from "vitest";

import { UsMoClientMetadata } from "~datatypes";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../../components/StoreProvider";
import { Client } from "../../../../WorkflowsStore";
import { StructuredAddress } from "./ClientInformationCard";
import { UsMoCaseOverview } from "./UsMoCaseOverview";

vi.mock("../../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;
const useFeatureVariantsMock = useFeatureVariants as Mock;

const sampleMetadata: UsMoClientMetadata = {
  stateCode: "US_MO",
  birthdate: parseISO("1988-03-14"),
  sex: "MALE",
  latestCycleSentences: [
    {
      classificationSubtype: "D",
      classificationType: "Felony",
      description: "Possession of Controlled Substance",
      statute: "579.015",
    },
  ],
};

const sampleAddress: StructuredAddress = {
  addressLine1: "2342 Lasalle St.",
  addressCity: "St. Louis",
  addressState: "MO",
  addressZip: "63104",
};

/**
 * Wrap the component under test in a fresh `QueryClientProvider`. `SARReports`
 * uses `useSuspenseQuery` under the hood (gated on the `usMoSarInClientsPage`
 * FV); even with the FV off the wrapper keeps the test setup uniform and
 * ready for the FV-on cases.
 */
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

/** Minimal `Client` stub mirroring the getters the wrapper reads. The MobX
 * nature isn't relevant in this test — `UsMoCaseOverview` forwards `client`
 * to `ClientInformationCard` and `SARReports`, which read a few props off it. */
function makeFakeClient({
  metadata,
  currentPhysicalResidenceAddressStructured,
  externalId = "client-ext-1",
  stateCode = "US_MO",
}: {
  metadata?: Partial<Client["metadata"]>;
  currentPhysicalResidenceAddressStructured?: StructuredAddress;
  externalId?: string;
  stateCode?: string;
}): Client {
  return {
    metadata,
    currentPhysicalResidenceAddressStructured,
    externalId,
    stateCode,
  } as unknown as Client;
}

describe("UsMoCaseOverview", () => {
  beforeEach(() => {
    tk.freeze(new Date(2026, 4, 28));
    // SARReports reads root store + FV. Default to FV off so existing tests
    // remain isolated from the Reports section.
    useFeatureVariantsMock.mockReturnValue({});
    useRootStoreMock.mockReturnValue({
      sentencingStore: {
        apiClient: {
          getSARsByClient: vi.fn().mockResolvedValue([]),
        },
      },
    });
  });

  afterEach(() => {
    tk.reset();
    vi.clearAllMocks();
  });

  test("renders the Case Overview section heading", () => {
    const client = makeFakeClient({
      metadata: sampleMetadata,
      currentPhysicalResidenceAddressStructured: sampleAddress,
    });
    renderWithQueryClient(<UsMoCaseOverview client={client} />);
    expect(screen.getByText("Case Overview")).toBeInTheDocument();
  });

  test("renders Personal Details + Housing for a US_MO client", () => {
    const client = makeFakeClient({
      metadata: sampleMetadata,
      currentPhysicalResidenceAddressStructured: sampleAddress,
    });
    renderWithQueryClient(<UsMoCaseOverview client={client} />);

    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getByText("2342 Lasalle St.")).toBeInTheDocument();
  });

  test("does not render the Reports section when the feature variant is off", () => {
    useFeatureVariantsMock.mockReturnValue({});
    const client = makeFakeClient({
      metadata: sampleMetadata,
      currentPhysicalResidenceAddressStructured: sampleAddress,
    });
    renderWithQueryClient(<UsMoCaseOverview client={client} />);

    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
  });

  test("renders the Reports section inside the CardFrame when the FV is on and SARs are present", async () => {
    useFeatureVariantsMock.mockReturnValue({ usMoSarInClientsPage: true });
    useRootStoreMock.mockReturnValue({
      sentencingStore: {
        apiClient: {
          getSARsByClient: vi.fn().mockResolvedValue([
            {
              id: "sar-1",
              externalId: "sar-ext-1",
              status: "InProgress",
              completionDate: null,
              courtDate: null,
              staff: { pseudonymizedId: "staff-1" },
            },
          ]),
        },
      },
    });

    const client = makeFakeClient({
      metadata: sampleMetadata,
      currentPhysicalResidenceAddressStructured: sampleAddress,
    });
    renderWithQueryClient(<UsMoCaseOverview client={client} />);

    // The skeleton fallback also renders a "Reports" heading; wait for an
    // actual SAR row to confirm the suspense has resolved before asserting
    // the section's structural placement.
    await waitFor(() => {
      expect(screen.getByText("SAR - In Progress")).toBeInTheDocument();
    });

    // Reports lives inside the same CardFrame as Personal Details + Housing,
    // so all three section headings should share a single parent <div>. That
    // is what makes the `& > section + section { border-top }` divider rule
    // on the CardFrame apply.
    const personalDetailsSection = screen
      .getByText("Personal Details")
      .closest("section");
    const housingSection = screen.getByText("Housing").closest("section");
    const reportsSection = screen.getByText("Reports").closest("section");

    expect(personalDetailsSection).not.toBeNull();
    expect(housingSection).not.toBeNull();
    expect(reportsSection).not.toBeNull();
    expect(reportsSection?.parentElement).toBe(
      personalDetailsSection?.parentElement,
    );
    expect(reportsSection?.parentElement).toBe(housingSection?.parentElement);
  });
});
