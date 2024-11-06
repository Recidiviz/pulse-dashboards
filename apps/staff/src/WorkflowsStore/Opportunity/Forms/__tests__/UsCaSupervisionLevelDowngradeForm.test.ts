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

import { DocumentData } from "firebase/firestore";
import { configure } from "mobx";

import { RootStore } from "../../../../RootStore";
import { Client } from "../../../Client";
import { UsCaSupervisionLevelDowngradeOpportunity } from "../../UsCa";
import { UsCaSupervisionLevelDowngradeForm } from "../UsCaSupervisionLevelDowngradeForm";

// To adapt this to a new form/opportunity, change the type of `form` and update the opp and
// person constructors if needed. Individual tests can modify personRecord and oppRecord, but
// for supervision opportunities be sure to call `opp.person.updateRecord(personRecord)` after
// changing the personRecord.

let form: UsCaSupervisionLevelDowngradeForm;
let opp: (typeof form)["opportunity"];
let personRecord: (typeof opp)["person"]["record"];
let oppRecord: DocumentData;

type PartialFormData = ReturnType<(typeof form)["prefilledDataTransformer"]>;

function createTestUnit() {
  const rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  personRecord = {
    personType: "CLIENT",
    stateCode: "US_OZ",
    recordId: "US_OZ1",
    pseudonymizedId: "pseudo1",
    displayId: "d1",
    personExternalId: "pei1",
    personName: { givenNames: "Joe", middleNames: "Quimby", surname: "Test" },
    officerId: "zzz",
    allEligibleOpportunities: [],
  };
  oppRecord = {
    stateCode: "US_OZ",
    externalId: "pei1",
    formInformation: {
      cdcno: "opRecordCDCno",
    },
    eligibleCriteria: {
      noSupervisionViolationWithin6Months: null,
      supervisionLevelIsHighFor6Months: {
        highStartDate: "2019-04-01T12:00",
      },
      usCaAssessmentLevel3OrLower: null,
      usCaHousingTypeIsNotTransient: null,
    },
    ineligibleCriteria: {},
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  };
  const person = new Client(personRecord, rootStore);
  opp = new UsCaSupervisionLevelDowngradeOpportunity(person, oppRecord);
  form = opp.form;
}

beforeEach(() => {
  configure({ safeDescriptors: false });
  createTestUnit();
});

afterEach(() => {
  configure({ safeDescriptors: true });
  vi.resetAllMocks();
});

describe("prefilledDataTransformer", () => {
  test("uses CDCR number from the client record", () => {
    personRecord.displayId = "CDCNO";
    personRecord.personName.surname = "California";
    opp.person.updateRecord(personRecord);

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      cdcNumber: "CDCNO",
      fullName: "California, Joe Q.",
    });
  });

  test("handles lack of middle name", () => {
    delete personRecord.personName.middleNames;
    opp.person.updateRecord(personRecord);

    expect(form.prefilledDataTransformer()).toStrictEqual<PartialFormData>({
      cdcNumber: "d1",
      fullName: "Test, Joe",
    });
  });
});
