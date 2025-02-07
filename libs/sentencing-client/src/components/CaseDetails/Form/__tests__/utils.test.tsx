// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import _ from "lodash";

import { ReportType } from "../../../constants";
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  CLIENT_COUNTY_KEY,
  CLIENT_DISTRICT_KEY,
  CLIENT_GENDER_KEY,
  COUNTY_KEY,
  DISTRICT_KEY,
  HAS_DEVELOPMENTAL_DISABILITY_KEY,
  HAS_PREVIOUS_TREATMENT_COURT_KEY,
  IS_VETERAN_KEY,
  LSIR_SCORE_KEY,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  OFFENSE_KEY,
  OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY,
  OTHER_NEED_TO_BE_ADDRESSED_KEY,
  OTHER_PROTECTIVE_FACTORS_KEY,
  PLEA_KEY,
  PROTECTIVE_FACTORS_KEY,
  ProtectiveFactors,
  REPORT_TYPE_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../../constants";
import {
  mentalHealthDiagnoses,
  NO_OPTION,
  NONE_OPTION,
  NOT_SURE_YET_OPTION,
  YES_OPTION,
} from "../constants";
import { transformUpdates } from "../utils";

describe("transformUpdates", () => {
  it("should handle updates with SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY key and NONE_OPTION correctly", () => {
    const updates = {
      [SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY]: NONE_OPTION,
    };

    const result = transformUpdates(updates);

    expect(result[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY]).toBe(NONE_OPTION);
    expect(result[ASAM_CARE_RECOMMENDATION_KEY]).toBeNull(); // A `None` option should null out the ASAM Level of Care recommendation value
  });

  it("should handle updates with SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY key and NOT_SURE_YET_OPTION correctly", () => {
    const updates = {
      [SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY]: NOT_SURE_YET_OPTION,
    };

    const result = transformUpdates(updates);

    expect(result[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY]).toBeNull();
    expect(result[ASAM_CARE_RECOMMENDATION_KEY]).toBeNull(); // A `Not sure yet` option should null out the ASAM Level of Care recommendation value
  });

  it("should convert NOT_SURE_YET_OPTION to null", () => {
    const updates = {
      [IS_VETERAN_KEY]: NOT_SURE_YET_OPTION,
    };

    const result = transformUpdates(updates);

    expect(result[IS_VETERAN_KEY]).toBeNull();
  });

  it("should convert YES_OPTION to true", () => {
    const updates = {
      [IS_VETERAN_KEY]: YES_OPTION,
    };

    const result = transformUpdates(updates);

    expect(result[IS_VETERAN_KEY]).toBe(true);
  });

  it("should convert NO_OPTION to false", () => {
    const updates = {
      [IS_VETERAN_KEY]: NO_OPTION,
    };

    const result = transformUpdates(updates);

    expect(result[IS_VETERAN_KEY]).toBe(false);
  });

  it("should convert array values using formatFormEnumValue", () => {
    const updates = {
      [MENTAL_HEALTH_DIAGNOSES_KEY]: [
        mentalHealthDiagnoses.MajorDepressiveDisorder,
        mentalHealthDiagnoses.BorderlinePersonalityDisorder,
      ],
    };

    const mentalHealthDiagnosesEnums = _.invert(mentalHealthDiagnoses);

    const result = transformUpdates(updates);

    expect(result[MENTAL_HEALTH_DIAGNOSES_KEY]).toEqual([
      mentalHealthDiagnosesEnums[mentalHealthDiagnoses.MajorDepressiveDisorder],
      mentalHealthDiagnosesEnums[
        mentalHealthDiagnoses.BorderlinePersonalityDisorder
      ],
    ]);
  });

  it("should leave null, boolean, and number values unchanged", () => {
    const updates = {
      [PLEA_KEY]: null,
      [HAS_DEVELOPMENTAL_DISABILITY_KEY]: true,
      [LSIR_SCORE_KEY]: 42,
    };

    const result = transformUpdates(updates);

    expect(result[PLEA_KEY]).toBeNull();
    expect(result[HAS_DEVELOPMENTAL_DISABILITY_KEY]).toBe(true);
    expect(result[LSIR_SCORE_KEY]).toBe(42);
  });

  it("should leave other needs, other protective factors, other mental health diagnosis, offense, county, district, client county, client district keys unchanged", () => {
    const updates = {
      [OTHER_NEED_TO_BE_ADDRESSED_KEY]: "Some other need",
      [OTHER_PROTECTIVE_FACTORS_KEY]: "Some other protective factor",
      [OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY]: "Some other mental health diagnosis",
      [OFFENSE_KEY]:
        "POSSESSION OF A CONTROLLED SUBSTANCE WITH THE INTENT TO DELIVER",
      [COUNTY_KEY]: "Ada",
      [DISTRICT_KEY]: "DISTRICT 3",
      [CLIENT_COUNTY_KEY]: "Caldwell",
      [CLIENT_DISTRICT_KEY]: "DISTRICT 2",
    };

    const result = transformUpdates(updates);

    expect(result[OTHER_NEED_TO_BE_ADDRESSED_KEY]).toBe("Some other need");
    expect(result[OTHER_PROTECTIVE_FACTORS_KEY]).toBe(
      "Some other protective factor",
    );
    expect(result[OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY]).toBe(
      "Some other mental health diagnosis",
    );
    expect(result[OFFENSE_KEY]).toBe(
      "POSSESSION OF A CONTROLLED SUBSTANCE WITH THE INTENT TO DELIVER",
    );
    expect(result[COUNTY_KEY]).toBe("Ada");
    expect(result[DISTRICT_KEY]).toBe("DISTRICT 3");
    expect(result[CLIENT_COUNTY_KEY]).toBe("Caldwell");
    expect(result[CLIENT_DISTRICT_KEY]).toBe("DISTRICT 2");
  });

  it("should convert REPORT_TYPE_KEY value correctly", () => {
    const updates = {
      [REPORT_TYPE_KEY]: ReportType.FileReviewWithUpdatedLSIRScore,
    };

    const reportTypeDisplayNameToEnum = _.invert(ReportType);

    const result = transformUpdates(updates);

    expect(result[REPORT_TYPE_KEY]).toBe(
      reportTypeDisplayNameToEnum[ReportType.FileReviewWithUpdatedLSIRScore],
    );
  });

  it("should convert CLIENT_GENDER_KEY value correctly", () => {
    const updates = {
      [CLIENT_GENDER_KEY]: "Non-binary",
    };

    const result = transformUpdates(updates);

    expect(result[CLIENT_GENDER_KEY]).toBe("NON_BINARY");
  });

  it("should format everything else in PascalCase", () => {
    const updates = {
      [PROTECTIVE_FACTORS_KEY]:
        ProtectiveFactors.ActivelyParticipatingInTreatmentPrograms,
    };

    const protectiveFactorsToEnum = _.invert(ProtectiveFactors);

    const result = transformUpdates(updates);

    expect(result[PROTECTIVE_FACTORS_KEY]).toBe(
      protectiveFactorsToEnum[
        ProtectiveFactors.ActivelyParticipatingInTreatmentPrograms
      ],
    );
  });

  it("should not include undefined keys", () => {
    const updates = {
      [HAS_PREVIOUS_TREATMENT_COURT_KEY]: undefined,
    };

    const result = transformUpdates(updates);

    expect(result[HAS_PREVIOUS_TREATMENT_COURT_KEY]).toBeUndefined();
  });
});
