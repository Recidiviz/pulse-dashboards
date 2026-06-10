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
import { parseISO } from "date-fns";
import tk from "timekeeper";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { UsMoClientMetadata } from "~datatypes";

import { Client } from "../../../../WorkflowsStore";
import { StructuredAddress } from "./ClientInformationCard";
import { UsMoCaseOverview } from "./UsMoCaseOverview";

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

/** Minimal `Client` stub mirroring the two getters the wrapper reads. The
 * MobX nature isn't relevant in this test — `UsMoCaseOverview` just forwards
 * `client` to `ClientInformation` which reads two props off it. */
function makeFakeClient({
  metadata,
  currentPhysicalResidenceAddressStructured,
}: {
  metadata?: Partial<Client["metadata"]>;
  currentPhysicalResidenceAddressStructured?: StructuredAddress;
}): Client {
  return {
    metadata,
    currentPhysicalResidenceAddressStructured,
  } as unknown as Client;
}

describe("UsMoCaseOverview", () => {
  beforeEach(() => {
    tk.freeze(new Date(2026, 4, 28));
  });

  afterEach(() => {
    tk.reset();
  });

  test("renders the Case Overview section heading", () => {
    const client = makeFakeClient({
      metadata: sampleMetadata,
      currentPhysicalResidenceAddressStructured: sampleAddress,
    });
    render(<UsMoCaseOverview client={client} />);
    expect(screen.getByText("Case Overview")).toBeInTheDocument();
  });

  test("renders Personal Details + Housing for a US_MO client", () => {
    const client = makeFakeClient({
      metadata: sampleMetadata,
      currentPhysicalResidenceAddressStructured: sampleAddress,
    });
    render(<UsMoCaseOverview client={client} />);

    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getByText("2342 Lasalle St.")).toBeInTheDocument();
  });
});
