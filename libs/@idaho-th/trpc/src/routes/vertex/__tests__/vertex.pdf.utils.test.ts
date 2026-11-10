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

import type { HousingApplicationPageExtractedData } from "~@idaho-th/trpc/routes/vertex/vertex.types";

import { mergeHousingPartials } from "../vertex.pdf.utils";

describe("mergeHousingPartials", () => {
  it("deep-merges nested section objects across pages", () => {
    const page1 = {
      page: 1 as const,
      clientIdentity: {
        clientFullName: "Jane Doe",
        idocNumber: "12345",
        dob: null,
        age: 40,
        ssnLast4: null,
        gender: "Female" as const,
        personalPhoneNumber: null,
      },
      legalStatus: {
        legalCurrentStatus: "Termer" as const,
        legalMostRecentConviction: null,
        legalCountyOfCrime: "Ada" as const,
        legalSexOffenderRegistry: null,
        legalBackupForIcOrIce: null,
        childVisitationRequired: null,
        priorInvoluntaryDischarge: null,
        violenceHistoryDors: null,
        housingProbationParoleAtRelease: null,
        tpdHousingNeededDate: "2026-08-01",
        paroleHearingCompleted: null,
        vehicleOnSite: null,
      },
    };

    const page2 = {
      page: 2 as const,
      clientIdentity: {
        clientFullName: "Jane Doe",
        idocNumber: null,
        dob: "1985-01-15",
        age: 41,
        ssnLast4: "6789",
        gender: "Female" as const,
        personalPhoneNumber: "208-555-0100",
      },
      signature: {
        signatureProvided: true,
        signatureDate: "2026-05-01",
      },
    };

    const merged = mergeHousingPartials([
      page1 as unknown as HousingApplicationPageExtractedData,
      page2 as unknown as HousingApplicationPageExtractedData,
    ]);

    expect(merged.clientIdentity).toMatchObject({
      clientFullName: "Jane Doe",
      idocNumber: "12345",
      dob: "1985-01-15",
      ssnLast4: "6789",
      personalPhoneNumber: "208-555-0100",
    });
    expect(merged.legalStatus.tpdHousingNeededDate).toBe("2026-08-01");
    expect(merged.signature).toEqual({
      signatureProvided: true,
      signatureDate: "2026-05-01",
    });
  });

  it("preserves an earlier idocNumber when a later page sets it to null", () => {
    const merged = mergeHousingPartials([
      {
        page: 1 as const,
        clientIdentity: {
          clientFullName: "A",
          idocNumber: "KEEP",
          dob: null,
          age: 30,
          ssnLast4: null,
          gender: "Male" as const,
          personalPhoneNumber: null,
        },
      } as unknown as HousingApplicationPageExtractedData,
      {
        page: 2 as const,
        clientIdentity: {
          clientFullName: "A",
          idocNumber: null,
          dob: null,
          age: 30,
          ssnLast4: null,
          gender: "Male" as const,
          personalPhoneNumber: null,
        },
      } as unknown as HousingApplicationPageExtractedData,
    ]);

    expect(merged.clientIdentity.idocNumber).toBe("KEEP");
  });

  it("lets later non-null nested values overwrite earlier ones", () => {
    const merged = mergeHousingPartials([
      {
        page: 1 as const,
        clientIdentity: {
          clientFullName: "Old Name",
          idocNumber: "1",
          dob: null,
          age: 20,
          ssnLast4: null,
          gender: "Male" as const,
          personalPhoneNumber: null,
        },
      } as unknown as HousingApplicationPageExtractedData,
      {
        page: 2 as const,
        clientIdentity: {
          clientFullName: "New Name",
          idocNumber: "2",
          dob: null,
          age: 21,
          ssnLast4: null,
          gender: "Male" as const,
          personalPhoneNumber: null,
        },
      } as unknown as HousingApplicationPageExtractedData,
    ]);

    expect(merged.clientIdentity.clientFullName).toBe("New Name");
    expect(merged.clientIdentity.idocNumber).toBe("2");
  });
});
