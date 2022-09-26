// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { cloneDeep } from "lodash";

import { TransformFunction } from "../subscriptions";
import { optionalFieldToDate } from "../utils";

export interface LSUReferralRecord {
  stateCode: string;
  externalId: string;
  formInformation: {
    clientName: string;
  };
  criteria: {
    riskLevel?: { riskLevel?: string; lastIncrease?: Date };
    negativeUaWithin90Days?: { lastNegativeUa?: Date };
    noFelonyConvictions?: { lastFelonyConviction?: Date };
    noViolentOrDuiConvictions?: { lastViolentOrDuiConviction?: Date };
    verifiedEmployment?: { employmentVerifiedDate?: Date };
  };
}

export type LSUDraftData = {
  clientName: string;
};

export const transformReferral: TransformFunction<LSUReferralRecord> = (
  record
) => {
  if (!record) return;

  const transformedRecord = cloneDeep(record) as LSUReferralRecord;

  transformedRecord.criteria.riskLevel = {
    riskLevel: record.criteria.riskLevel?.risklevel,
    lastIncrease: optionalFieldToDate(record.criteria.riskLevel?.lastIncrease),
  };

  transformedRecord.criteria.negativeUaWithin90Days = {
    lastNegativeUa: optionalFieldToDate(
      record.criteria.negativeUaWithin90Days?.lastNegativeUA
    ),
  };

  transformedRecord.criteria.noFelonyConvictions = {
    lastFelonyConviction: optionalFieldToDate(
      record.criteria.noFelonyConvictions?.lastFelonyConviction
    ),
  };

  transformedRecord.criteria.noViolentOrDuiConvictions = {
    lastViolentOrDuiConviction: optionalFieldToDate(
      record.criteria.noViolentOrDUIConvictions?.lastViolentOrDUIConviction
    ),
  };

  transformedRecord.criteria.verifiedEmployment = {
    employmentVerifiedDate: optionalFieldToDate(
      record.criteria.verifiedEmployment?.employmentVerifiedDate
    ),
  };

  return transformedRecord;
};
