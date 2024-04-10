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
import { FeatureVariant, TenantId } from "../../../../RootStore/types";
import { JusticeInvolvedPerson } from "../../../types";
import { OTHER_KEY } from "../../../utils";
import { WorkflowsStore } from "../../../WorkflowsStore";
import { OpportunityType } from "../..";
import { OpportunityBase } from "../../OpportunityBase";
import { ILocalOpportunityConfiguration } from "../interfaces/LocalOpportunityConfiguration";

export const mockUsXxOpp: OpportunityType = "mockUsXxOpp" as OpportunityType;
export const mockUsXxTwoOpp: OpportunityType =
  "mockUsXxTwoOpp" as OpportunityType;

export class TestOpportunity<
  T extends JusticeInvolvedPerson,
> extends OpportunityBase<T, any, any> {
  constructor(...[person, type, rootStore, ...args]: any[]) {
    super(person, type, rootStore, ...args);
  }
}

export const mockLocalOpportunityConfigurationObject: ILocalOpportunityConfiguration =
  {
    systemType: "SUPERVISION",
    stateCode: "US_XX" as TenantId,
    urlSection: "mockOpportunity",
    label: "Mock Opportunity",
    featureVariant: "usXxMockOpportunity" as FeatureVariant,
    initialHeader: "Mock initial header to search for something",
    snooze: {
      autoSnoozeParams: {
        type: "snoozeUntil",
        params: {
          weekday: "Sunday",
        },
      },
    },
    dynamicEligibilityText:
      "client[|s] may be on or past their expiration date",
    callToAction:
      "Review these clients and complete their auto-generated TEPE Note.",
    firestoreCollection: "US_XX_mockOpportunity",
    methodologyUrl: "methodologyUrl",
    isAlert: true,
    denialReasons: {
      CODE: "Denial reason",
      [OTHER_KEY]: "Other",
    },
    sidebarComponents: [],
  };

export const mockApiOpportunityConfigurationResponse = {
  usIdCrcWorkRelease: {
    stateCode: "US_ID",
    urlSection: "CRCWorkRelease",
    displayName: "Work-release at Community Reentry Centers",
    featureVariant: "usIdCRC",
    dynamicEligibilityText:
      "resident[|s] may be eligible for work-release at a Community Reentry Center",
    callToAction:
      "Review residents who may be eligible for work-release to a CRC and start their paperwork in ATLAS.",
    firestoreCollection: "US_ID-CRCWorkReleaseReferrals",
    snooze: {
      defaultSnoozeDays: 30,
      maxSnoozeDays: 90,
    },
    denialReasons: {
      MEDICAL: "Was not approved by an IDOC medical provider",
      PENDING:
        "There are pending felony charges or felony investigations in which the resident is a suspect",
      BEHAVIOR: "Resident has had poor institutional behavior",
      PROGRAM: "Missing required facility programming",
      Other: "Other, please specify a reason",
    },
    eligibleCriteriaCopy: {
      custodyLevelIsMinimum: {
        text: "Currently on Minimum custody",
      },
      notServingForSexualOffense: {
        text: "Not serving for a sexual offense",
      },
    },
    ineligibleCriteriaCopy: {},
    sidebarComponents: ["Incarceration", "UsIdPastTwoYearsAlert", "CaseNotes"],
    methodologyUrl:
      "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
  },
};

export const mockWorkflowsStore: Partial<WorkflowsStore> = {
  featureVariants: { mockFv: {} } as unknown as Pick<
    WorkflowsStore,
    "featureVariants"
  >,
} as unknown as Partial<WorkflowsStore>;
