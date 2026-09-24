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

import { addDays, startOfToday, subDays } from "date-fns";

import {
  RawWorkflowsResidentRecord,
  WorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "~datatypes";

import { RootStore } from "../../../RootStore";
import { formatDateToISO } from "../../../utils";
import { ParoleStore } from "../../ParoleStore";
import { ParoleAPIClient } from "../ParoleAPIClient";

function buildUsIdResident(
  raw: Partial<RawWorkflowsResidentRecord> = {},
): WorkflowsResidentRecord {
  return workflowsResidentRecordSchema.parse({
    recordId: "us_id_res999",
    personName: { givenNames: "Test", surname: "Resident" },
    personExternalId: "RES999",
    displayId: "dRES999",
    pseudonymizedId: "anonres999",
    stateCode: "US_ID",
    facilityId: "FACILITY1",
    allEligibleOpportunities: [],
    metadata: { stateCode: "US_ID", crcFacilities: [] },
    ...raw,
  });
}

function buildUsCoResident(
  raw: Partial<RawWorkflowsResidentRecord> = {},
): WorkflowsResidentRecord {
  return workflowsResidentRecordSchema.parse({
    recordId: "us_co_res999",
    personName: { givenNames: "Test", surname: "Resident" },
    personExternalId: "RES999",
    displayId: "dRES999",
    pseudonymizedId: "anonres999",
    stateCode: "US_CO",
    facilityId: "FACILITY1",
    allEligibleOpportunities: [],
    metadata: {
      stateCode: "US_CO",
      incarcerationStartDate: null,
      creditActivity: [],
      cohortLabel: "STANDARD",
    },
    ...raw,
  });
}

describe("ParoleAPIClient", () => {
  let rootStore: RootStore;
  let client: ParoleAPIClient;

  beforeEach(() => {
    rootStore = new RootStore();
    rootStore.tenantStore.currentTenantId = "US_ID";
    client = new ParoleAPIClient(new ParoleStore(rootStore));
  });

  describe("hearings", () => {
    it("throws for an unsupported tenant", async () => {
      rootStore.tenantStore.currentTenantId = "US_TN";

      await expect(client.hearings()).rejects.toThrow(
        /ParoleAPIClient\.hearings has no real data source for tenant \[US_TN\]/,
      );
    });

    it("scopes the US_CO query server-side to its docket window", async () => {
      rootStore.tenantStore.currentTenantId = "US_CO";
      const spy = vi
        .spyOn(rootStore.firestoreStore, "getResidentsForState")
        .mockResolvedValue([]);

      await client.hearings();

      // US_CO's docketConfig: windowDaysBefore 31, windowDaysAfter 14.
      expect(spy).toHaveBeenCalledWith("US_CO", {
        field: "metadata.nextParoleHearingDate",
        startDateInclusive: formatDateToISO(subDays(startOfToday(), 31)),
        endDateInclusive: formatDateToISO(addDays(startOfToday(), 14)),
      });
    });

    it("does not scope the US_ID query server-side, since its records don't have metadata.nextParoleHearingDate yet", async () => {
      rootStore.tenantStore.currentTenantId = "US_ID";
      const spy = vi
        .spyOn(rootStore.firestoreStore, "getResidentsForState")
        .mockResolvedValue([]);

      await client.hearings();

      expect(spy).toHaveBeenCalledWith("US_ID", undefined);
    });

    it("excludes a resident whose parole_hearings category is unhydrated", async () => {
      rootStore.tenantStore.currentTenantId = "US_CO";
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([buildUsCoResident()]);

      await expect(client.hearings()).resolves.toEqual([]);
    });

    it("builds a US_CO docket row from parole_hearings", async () => {
      rootStore.tenantStore.currentTenantId = "US_CO";
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsCoResident({
          metadata: {
            stateCode: "US_CO",
            incarcerationStartDate: null,
            creditActivity: [],
            cohortLabel: "STANDARD",
            paroleBoardClientProfile: {
              demographics: {},
              paroleHearings: [
                {
                  hearingStatus: "SCHEDULED",
                  hearingDate: "2026-11-02",
                  hearingType: "Parole Consideration",
                },
              ],
            },
          },
        }),
      ]);

      await expect(client.hearings()).resolves.toEqual([
        {
          docId: "RES999",
          displayId: "dRES999",
          individualName: "Test Resident",
          hearingDate: "2026-11-02",
          // Read from the record, not the hardcoded US_ID assumption.
          hearingType: "Parole Consideration",
          facility: "FACILITY1",
        },
      ]);
    });

    it("takes the soonest SCHEDULED hearing and ignores PREVIOUS ones", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              paroleHearings: [
                {
                  hearingStatus: "SCHEDULED",
                  hearingDate: "2027-01-15",
                  hearingType: "Later",
                },
                {
                  hearingStatus: "PREVIOUS",
                  hearingDate: "2020-01-01",
                  hearingType: "Past",
                },
                {
                  hearingStatus: "SCHEDULED",
                  hearingDate: "2026-06-01",
                  hearingType: "Soonest",
                },
              ],
            },
          },
        }),
      ]);

      const [hearing] = await client.hearings();

      expect(hearing.hearingDate).toBe("2026-06-01");
      expect(hearing.hearingType).toBe("Soonest");
    });

    it("prefers parole_hearings over the flat US_ID hearing dates", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            nextParoleHearingDate: "2026-05-01",
            paroleBoardClientProfile: {
              demographics: {},
              paroleHearings: [
                {
                  hearingStatus: "SCHEDULED",
                  hearingDate: "2026-09-09",
                  hearingType: "From the struct",
                },
              ],
            },
          },
        }),
      ]);

      const [hearing] = await client.hearings();

      expect(hearing.hearingDate).toBe("2026-09-09");
      expect(hearing.hearingType).toBe("From the struct");
    });

    it("maps a resident with a hearing date to a ParoleHearing", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            nextParoleHearingDate: "2026-05-01",
          },
        }),
      ]);

      await expect(client.hearings()).resolves.toEqual([
        {
          docId: "RES999",
          displayId: "dRES999",
          individualName: "Test Resident",
          hearingDate: "2026-05-01",
          hearingType: "Not yet available",
          facility: "FACILITY1",
        },
      ]);
    });

    it("prefers nextParoleHearingDate over initialParoleHearingDate", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            nextParoleHearingDate: "2026-05-01",
            initialParoleHearingDate: "2020-01-01",
          },
        }),
      ]);

      const [hearing] = await client.hearings();

      expect(hearing.hearingDate).toBe("2026-05-01");
    });

    it("falls back to initialParoleHearingDate when there is no next hearing date", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            initialParoleHearingDate: "2020-01-01",
          },
        }),
      ]);

      const [hearing] = await client.hearings();

      expect(hearing.hearingDate).toBe("2020-01-01");
    });

    it("excludes residents with no hearing date at all", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsIdResident({
          metadata: { stateCode: "US_ID", crcFacilities: [] },
        }),
      ]);

      await expect(client.hearings()).resolves.toEqual([]);
    });

    it("falls back to a placeholder when the resident has no facilityId", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentsForState",
      ).mockResolvedValue([
        buildUsIdResident({
          facilityId: null,
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            nextParoleHearingDate: "2026-05-01",
          },
        }),
      ]);

      const [hearing] = await client.hearings();

      expect(hearing.facility).toBe("Not yet available");
    });
  });

  describe("caseDetail", () => {
    it("throws for an unsupported tenant", async () => {
      rootStore.tenantStore.currentTenantId = "US_TN";

      await expect(client.caseDetail("RES999")).rejects.toThrow(
        /ParoleAPIClient\.caseDetail has no real data source for tenant \[US_TN\]/,
      );
    });

    it("throws when no resident is found for the docId", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(undefined);

      await expect(client.caseDetail("UNKNOWN_ID")).rejects.toThrow(
        /No US_ID resident found for docId \[UNKNOWN_ID\]/,
      );
    });

    it("maps every field the resident record has real data for", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          gender: "MALE",
          custodyLevel: "MINIMUM",
          admissionDate: "2019-08-12",
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            nextParoleHearingDate: "2026-05-01",
            paroleEligibilityDate: "2026-01-01",
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result).toMatchObject({
        docId: "RES999",
        displayId: "dRES999",
        name: "Test Resident",
        gender: "MALE",
        currentFacility: "FACILITY1",
        custodyLevel: "MINIMUM",
        hearingDate: "2026-05-01",
        sentenceStartDate: "2019-08-12",
        paroleEligibilityDate: "2026-01-01",
      });
    });

    it("sources dob from the parole_board_client_profile struct", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: { residentDob: "1986-07-27" },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.dob).toBe("1986-07-27");
    });

    it("sources dob from the same struct for US_CO", async () => {
      rootStore.tenantStore.currentTenantId = "US_CO";
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsCoResident({
          metadata: {
            stateCode: "US_CO",
            incarcerationStartDate: null,
            creditActivity: [],
            cohortLabel: "STANDARD",
            paroleBoardClientProfile: {
              demographics: { residentDob: "1974-02-05" },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.dob).toBe("1974-02-05");
    });

    it("falls back to UNKNOWN_DATE for dob when the struct has no residentDob", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: { demographics: {} },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.dob).toBe("9999-12-01");
    });

    it("falls back to explicit placeholders for fields with no real data source", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          gender: undefined,
          custodyLevel: undefined,
          admissionDate: undefined,
          metadata: { stateCode: "US_ID", crcFacilities: [] },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result).toEqual({
        docId: "RES999",
        displayId: "dRES999",
        name: "Test Resident",
        dob: "9999-12-01",
        gender: "Not yet available",
        currentFacility: "FACILITY1",
        custodyLevel: "Not yet available",
        caseManagerName: "Not yet available",
        hearingDate: undefined,
        hearingType: "Not yet available",
        sentenceStartDate: "9999-12-01",
        paroleEligibilityDate: "9999-12-01",
        mandatoryReleaseDate: "9999-12-01",
        parolePlan: { onFile: false, documents: [] },
        attachments: [],
        conductHistory: [],
        communitySupervisionPlan: [],
        docPrograms: [],
        edovoPrograms: [],
        offenseHistory: {
          offenses: [
            {
              county: "Not yet available",
              docket: "Not yet available",
              conviction: "Not yet available",
              classFelony: "Not yet available",
              sentence: "Not yet available",
              dateOfOffense: "9999-12-01",
              convictionDate: "9999-12-01",
              offenseNarrative: "Not yet available",
            },
          ],
          priorConvictions: [],
          victimInvolved: false,
          victimAttendingHearing: false,
        },
        riskAssessments: [],
        riskAndNeedsFactors: [],
      });
    });

    it("falls back to [UNKNOWN_OFFENSE] when activeSentences is empty", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              activeSentences: [],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.offenseHistory.offenses).toEqual([
        {
          county: "Not yet available",
          docket: "Not yet available",
          conviction: "Not yet available",
          classFelony: "Not yet available",
          sentence: "Not yet available",
          dateOfOffense: "9999-12-01",
          convictionDate: "9999-12-01",
          offenseNarrative: "Not yet available",
        },
      ]);
    });

    it("maps activeSentences into offenseHistory.offenses", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              activeSentences: [
                {
                  sentenceConvictionCounty: "Ada",
                  sentenceDocket: "CR-2020-001",
                  sentenceFelonyClass: "Felony Class 1",
                  sentenceChargeName: "Burglary",
                  sentenceStatute: "18-1401",
                  sentenceOffenseDate: "2019-05-01",
                  sentenceConvictionDate: "2019-11-01",
                  sentenceLength: "5y 0m 0d",
                  sentenceStartDate: "2019-11-01",
                  sentenceParoleEligibilityDate: "2026-01-01",
                  sentenceFullTermReleaseDate: "2029-01-01",
                },
                {
                  sentenceDocket: "CR-2021-002",
                  sentenceChargeName: "Grand Theft",
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.offenseHistory.offenses).toEqual([
        {
          county: "Ada",
          docket: "CR-2020-001",
          conviction: "Burglary",
          statute: "18-1401",
          classFelony: "Felony Class 1",
          sentence: "5y 0m 0d",
          dateOfOffense: "2019-05-01",
          convictionDate: "2019-11-01",
          offenseNarrative: "Not yet available",
          sentenceStartDate: "2019-11-01",
          paroleEligibilityDate: "2026-01-01",
          fullTermDate: "2029-01-01",
        },
        {
          county: "Not yet available",
          docket: "CR-2021-002",
          conviction: "Grand Theft",
          statute: undefined,
          classFelony: "Not yet available",
          sentence: "Not yet available",
          dateOfOffense: "9999-12-01",
          convictionDate: "9999-12-01",
          offenseNarrative: "Not yet available",
          sentenceStartDate: undefined,
          paroleEligibilityDate: undefined,
          fullTermDate: undefined,
        },
      ]);
    });

    it("treats a sentence's year-9999 fullTermDate/paroleEligibilityDate as absent", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              activeSentences: [
                {
                  sentenceDocket: "CR-2020-001",
                  sentenceParoleEligibilityDate: "9999-01-25",
                  sentenceFullTermReleaseDate: "9999-01-25",
                },
              ],
            },
          },
        }),
      );

      const [offense] = (await client.caseDetail("RES999")).offenseHistory
        .offenses;

      expect(offense.paroleEligibilityDate).toBeUndefined();
      expect(offense.fullTermDate).toBeUndefined();
    });

    it("maps US_CO's mrdTent/pedTent/incarcerationStartDate", async () => {
      rootStore.tenantStore.currentTenantId = "US_CO";
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsCoResident({
          metadata: {
            stateCode: "US_CO",
            incarcerationStartDate: "2019-08-12",
            mrdTent: "2033-01-03",
            pedTent: "2027-01-03",
            creditActivity: [],
            cohortLabel: "STANDARD",
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result).toMatchObject({
        sentenceStartDate: "2019-08-12",
        paroleEligibilityDate: "2027-01-03",
        mandatoryReleaseDate: "2033-01-03",
        // No parole_hearings on this mock resident, so this stays unset --
        // see the "sources hearingDate from parole_hearings" tests below
        // for a US_CO resident that has one.
        hearingDate: undefined,
      });
    });

    it("sources hearingDate from parole_hearings for both tenants", async () => {
      const scheduledHearing = {
        hearingStatus: "SCHEDULED",
        hearingDate: "2026-11-02",
      };

      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              paroleHearings: [scheduledHearing],
            },
          },
        }),
      );

      const idResult = await client.caseDetail("RES999");
      expect(idResult.hearingDate).toBe("2026-11-02");

      rootStore.tenantStore.currentTenantId = "US_CO";
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsCoResident({
          metadata: {
            stateCode: "US_CO",
            incarcerationStartDate: null,
            creditActivity: [],
            cohortLabel: "STANDARD",
            paroleBoardClientProfile: {
              demographics: {},
              paroleHearings: [scheduledHearing],
            },
          },
        }),
      );

      const coResult = await client.caseDetail("RES999");
      expect(coResult.hearingDate).toBe("2026-11-02");
    });

    it("sources hearingType from the same scheduled hearing as hearingDate", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              paroleHearings: [
                {
                  hearingStatus: "PREVIOUS",
                  hearingDate: "2024-01-01",
                  hearingType: "Past",
                },
                {
                  hearingStatus: "SCHEDULED",
                  hearingDate: "2026-11-02",
                  hearingType: "Parole Consideration",
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.hearingType).toBe("Parole Consideration");
      expect(result.hearingDate).toBe("2026-11-02");
    });

    it("falls back to a placeholder hearingType when the scheduled hearing has none", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              paroleHearings: [
                { hearingStatus: "SCHEDULED", hearingDate: "2026-11-02" },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.hearingType).toBe("Not yet available");
    });

    it("prefers demographics.facility over the resident record's facilityId", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          facilityId: "RAW_CODE_1",
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: { facility: "Idaho State Correctional Center" },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.currentFacility).toBe("Idaho State Correctional Center");
    });

    it("falls back to facilityId when demographics carries no facility", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          facilityId: "RAW_CODE_1",
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: { demographics: {} },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.currentFacility).toBe("RAW_CODE_1");
    });

    it("sources caseManagerName from demographics.caseManager", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: { caseManager: "ANGELA PORTELA" },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.caseManagerName).toBe("ANGELA PORTELA");
    });

    it("prefers a sentence's parole eligibility/mandatory release dates over the flat fields, treating a year-9999 sentence date as absent", async () => {
      rootStore.tenantStore.currentTenantId = "US_CO";
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsCoResident({
          metadata: {
            stateCode: "US_CO",
            incarcerationStartDate: null,
            mrdTent: "2033-01-03",
            pedTent: "2027-01-03",
            creditActivity: [],
            cohortLabel: "STANDARD",
            paroleBoardClientProfile: {
              demographics: {},
              activeSentences: [
                {
                  sentenceParoleEligibilityDate: "2026-06-01",
                  // US_CO's own "no date" placeholder -- treated as absent,
                  // falling back to mrdTent rather than showing year 9999.
                  sentenceMandatoryReleaseDate: "9999-01-20",
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.paroleEligibilityDate).toBe("2026-06-01");
      expect(result.mandatoryReleaseDate).toBe("2033-01-03");
    });

    it("falls back to placeholders for a US_CO resident missing those dates", async () => {
      rootStore.tenantStore.currentTenantId = "US_CO";
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(buildUsCoResident());

      const result = await client.caseDetail("RES999");

      expect(result).toMatchObject({
        sentenceStartDate: "9999-12-01",
        paroleEligibilityDate: "9999-12-01",
        mandatoryReleaseDate: "9999-12-01",
        hearingDate: undefined,
      });
    });

    it("maps criminalHistory into priorConvictions, dropping an entry missing either field", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              criminalHistory: [
                { historyCharge: "Burglary", historyDate: "2015-01-01" },
                { historyCharge: "Trespassing" },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.offenseHistory.priorConvictions).toEqual([
        { charge: "Burglary", date: "2015-01-01" },
      ]);
    });

    it("maps violations into conductHistory", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              violations: [
                {
                  violationCategory: "Class IIa",
                  violationDate: "2026-08-13",
                  violationType: "THREATS",
                  violationDescription: "Threatened another resident",
                  violationSanction: "SEGREGATN",
                  violationFacility: "Facility A",
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.conductHistory).toEqual([
        {
          date: "2026-08-13",
          facility: "Facility A",
          violation: "THREATS",
          description: "Threatened another resident",
          severity: "Class IIa",
          disposition: "SEGREGATN",
        },
      ]);
    });

    it("maps programs into docPrograms, translating US_ID and US_CO's different status values", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              programs: [
                {
                  // Already the normalized enum value for US_ID -- passes through untranslated.
                  programName: "Anger Management",
                  programStatus: "IN_PROGRESS",
                  programCategory: "Treatment",
                  programNeed: "Antisocial Thinking",
                },
                {
                  // US_CO's own free-form status, translated by this client.
                  programName: "Offender Led Program",
                  programStatus: "Transferred to another Facility",
                },
                {
                  // Unrecognized status -- dropped rather than guessed.
                  programName: "Mystery Program",
                  programStatus: "Some New Status",
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.docPrograms).toEqual([
        {
          name: "Anger Management",
          completionDate: null,
          type: "Treatment",
          criminogenicNeed: "Antisocial Thinking",
          status: "IN_PROGRESS",
        },
        {
          name: "Offender Led Program",
          completionDate: null,
          type: "Not yet available",
          criminogenicNeed: "Not yet available",
          status: "IN_PROGRESS",
        },
      ]);
    });

    it("maps edovoPrograms, dropping a WITHDRAWN entry since PAROLE_EDOVO_STATUS has no bucket for it", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              edovoPrograms: [
                {
                  edovoProgramName: "Financial Literacy",
                  edovoProgramStatus: "COMPLETED",
                  edovoProgramResult: "PASSED",
                  edovoProgramStartDate: "2024-02-09",
                  edovoProgramCompletionDate: "2024-03-09",
                  edovoProgramDuration: 28,
                },
                {
                  edovoProgramName: "Mindfulness",
                  edovoProgramStatus: "WITHDRAWN",
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.edovoPrograms).toEqual([
        {
          title: "Financial Literacy",
          completionDate: "2024-03-09",
          status: "completed",
          result: "passed",
          startDate: "2024-02-09",
          durationDays: 28,
        },
      ]);
    });

    it("maps riskAssessments, translating US_CO's raw tool labels and dropping an unscored entry", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              riskAssessments: [
                {
                  // Already the normalized enum value for US_ID.
                  assessmentType: "LSIR",
                  assessmentDate: "2026-05-01",
                  assessmentScore: 30,
                  assessmentMaxScore: 54,
                },
                {
                  // US_CO's raw label, translated by this client.
                  assessmentType: "RT Scoring Tool",
                  assessmentDate: "2026-05-08",
                  assessmentScore: 7,
                  assessmentMaxScore: 27,
                },
                {
                  // No score -- dropped rather than shown with one missing.
                  assessmentType: "LSIR",
                  assessmentDate: "2020-01-01",
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAssessments).toEqual([
        {
          tool: "LSIR",
          level: undefined,
          score: 30,
          maxScore: 54,
          date: "2026-05-01",
        },
        {
          tool: "RT",
          level: undefined,
          score: 7,
          maxScore: 27,
          date: "2026-05-08",
        },
      ]);
    });

    it("keeps an assessment scored 0, which is a real result", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              riskAssessments: [
                {
                  assessmentType: "LSIR",
                  assessmentDate: "2026-05-01",
                  assessmentScore: 0,
                  assessmentMaxScore: 54,
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAssessments).toEqual([
        {
          tool: "LSIR",
          level: undefined,
          score: 0,
          maxScore: 54,
          date: "2026-05-01",
        },
      ]);
    });

    it("keeps an assessment with no max score, which is every US_IX one", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              riskAssessments: [
                {
                  assessmentType: "LSIR",
                  assessmentDate: "2026-05-01",
                  assessmentLevel: "HIGH",
                  assessmentScore: 30,
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAssessments).toEqual([
        {
          tool: "LSIR",
          level: "HIGH",
          score: 30,
          maxScore: undefined,
          date: "2026-05-01",
        },
      ]);
    });

    it("groups an assessment's category rows into subcategories", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              riskAssessments: [
                {
                  assessmentType: "LSIR",
                  assessmentDate: "2026-05-01",
                  assessmentScore: 30,
                  assessmentMaxScore: 54,
                  assessmentCategoryName: "Criminal History",
                  assessmentCategoryScore: 8,
                  assessmentCategoryMaxScore: 10,
                },
                {
                  // Every row for the same assessment repeats its top-line
                  // score/date -- only assessmentCategory* varies per row.
                  assessmentType: "LSIR",
                  assessmentDate: "2026-05-01",
                  assessmentScore: 30,
                  assessmentMaxScore: 54,
                  assessmentCategoryName: "Employment",
                  assessmentCategoryScore: 3,
                  assessmentCategoryMaxScore: 5,
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAssessments).toEqual([
        {
          tool: "LSIR",
          score: 30,
          maxScore: 54,
          date: "2026-05-01",
          subcategories: [
            { name: "Criminal History", score: 8, maxScore: 10 },
            { name: "Employment", score: 3, maxScore: 5 },
          ],
        },
      ]);
    });

    it("omits subcategories (rather than an empty array) when no row has a category", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              riskAssessments: [
                {
                  assessmentType: "LSIR",
                  assessmentDate: "2026-05-01",
                  assessmentScore: 30,
                  assessmentMaxScore: 54,
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAssessments).toEqual([
        { tool: "LSIR", score: 30, maxScore: 54, date: "2026-05-01" },
      ]);
      expect(result.riskAssessments[0]).not.toHaveProperty("subcategories");
    });

    it("never builds subcategories for CARAS, since its wire shape has no place for value/coefficient", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              riskAssessments: [
                {
                  assessmentType: "CARAS",
                  assessmentDate: "2026-05-01",
                  assessmentScore: 40,
                  assessmentMaxScore: 100,
                  assessmentCategoryName: "Criminal History",
                  assessmentCategoryScore: 8,
                  assessmentCategoryMaxScore: 10,
                },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAssessments).toEqual([
        { tool: "CARAS", score: 40, maxScore: 100, date: "2026-05-01" },
      ]);
    });

    it("maps latestRiskNeedSummary into riskAndNeedsFactors, showing each raw scale label as-is", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              latestRiskNeedSummary: {
                assessmentLatestMedical: ["0", "Low"],
                // A compound label, shown as-is rather than translated.
                assessmentLatestMentalHealth: ["3", "Low to moderate"],
              },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAndNeedsFactors).toEqual([
        { factor: "Medical", score: "0", scale: "Low" },
        { factor: "Mental Health", score: "3", scale: "Low to moderate" },
      ]);
    });

    it("drops a latestRiskNeedSummary domain that hasn't migrated to [score, scale] pairs yet, without failing to parse the rest of the resident", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              latestRiskNeedSummary: {
                // Migrated to the new pair format.
                assessmentLatestMedical: ["0", "Low"],
                // Legacy single-string format -- must not fail the parse.
                assessmentLatestDental:
                  "3 - Low to moderate need for dental care",
              },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.riskAndNeedsFactors).toEqual([
        { factor: "Medical", score: "0", scale: "Low" },
      ]);
    });

    it("maps parolePlan.onFile and its document when a plan is on file", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              parolePlan: {
                parolePlanIsOnFile: true,
                parolePlanLastUpdatedDate: "2026-06-01",
                parolePlanUrl: "https://example.com/plan.pdf",
                parolePlanDate: "2026-06-01",
              },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.parolePlan).toEqual({
        onFile: true,
        lastUpdated: "2026-06-01",
        documents: [
          { url: "https://example.com/plan.pdf", uploadDate: "2026-06-01" },
        ],
      });
    });

    it("drops the communitySupervisionPlan entry when parolePlanRecommended isn't a recognized status", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              parolePlan: {
                parolePlanIsOnFile: true,
                parolePlanSponsorName: "Jane Doe",
              },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.communitySupervisionPlan).toEqual([]);
    });

    it("maps the communitySupervisionPlan sponsor when parolePlanRecommended is recognized", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              parolePlan: {
                parolePlanIsOnFile: true,
                parolePlanSponsorName: "Jane Doe",
                parolePlanSponsorRelationship: "Sister",
                parolePlanAddress: "123 Main St",
                parolePlanRecommended: "Pending",
              },
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.communitySupervisionPlan).toEqual([
        {
          typeOfPlan: "Not yet available",
          name: "Jane Doe",
          relationship: "Sister",
          address: "123 Main St",
          recommended: "Pending",
        },
      ]);
    });

    it("maps attachments, falling back to Other for an unrecognized type and dropping one with no url", async () => {
      vi.spyOn(
        rootStore.firestoreStore,
        "getResidentByPersonExternalId",
      ).mockResolvedValue(
        buildUsIdResident({
          metadata: {
            stateCode: "US_ID",
            crcFacilities: [],
            paroleBoardClientProfile: {
              demographics: {},
              attachments: [
                {
                  attachmentName: "Victim Statement",
                  attachmentType: "VICTIM_STATEMENT",
                  attachmentUrl: "https://example.com/statement.pdf",
                  attachmentUploadDate: "2024-11-16",
                },
                {
                  attachmentName: "PSI Report",
                  attachmentType: "PSI",
                  attachmentUrl: "https://example.com/psi.pdf",
                  attachmentUploadDate: "2024-11-17",
                },
                { attachmentName: "No URL" },
              ],
            },
          },
        }),
      );

      const result = await client.caseDetail("RES999");

      expect(result.attachments).toEqual([
        {
          name: "Victim Statement",
          type: "Victim Impact Letter",
          url: "https://example.com/statement.pdf",
          uploadDate: "2024-11-16",
        },
        {
          name: "PSI Report",
          type: "Other",
          url: "https://example.com/psi.pdf",
          uploadDate: "2024-11-17",
        },
      ]);
    });
  });
});
