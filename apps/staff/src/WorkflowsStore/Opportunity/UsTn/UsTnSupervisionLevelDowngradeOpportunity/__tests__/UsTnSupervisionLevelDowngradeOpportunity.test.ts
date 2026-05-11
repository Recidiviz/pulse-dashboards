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

import * as Sentry from "@sentry/react";

import { Client } from "../../../../Client";
import { SupervisionLevelDowngradeReferralRecord } from "../../../SupervisionLevelDowngradeReferralRecord";
import { validateParsedRecord } from "../UsTnSupervisionLevelDowngradeOpportunity";

const captureExceptionSpy = vi.spyOn(Sentry, "captureException");

const getMockClient = (supervisionLevel = "Moderate") =>
  ({
    supervisionLevel,
    rootStore: {
      workflowsStore: {
        formatSupervisionLevel: (x) => x,
      },
    },
  }) as Client;

const getMockRecord = (supervisionLevel = "Medium") =>
  ({
    eligibleCriteria: {
      supervisionLevelHigherThanAssessmentLevel: {
        supervisionLevel,
      },
    },
  }) as SupervisionLevelDowngradeReferralRecord;

describe("validateParsedRecord", () => {
  it("does not capture the exception when the mismatch is Medium vs Moderate", () => {
    validateParsedRecord(getMockClient(), getMockRecord());
    expect(captureExceptionSpy).not.toHaveBeenCalled();
  });

  it("captures the exception when one is not Medium or Moderate", () => {
    validateParsedRecord(getMockClient("very low"), getMockRecord());
    expect(captureExceptionSpy).toHaveBeenCalled();

    vi.resetAllMocks();

    expect(captureExceptionSpy).not.toHaveBeenCalled();
    validateParsedRecord(getMockClient(), getMockRecord("trustee"));
    expect(captureExceptionSpy).toHaveBeenCalled();
  });
});
