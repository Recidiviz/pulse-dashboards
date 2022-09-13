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

type LSUCriteriaMet = {
  eligibleRiskLevel?: { riskLevel: string; lastIncrease: string };
  lastNegativeUA?: string;
  lastFelonyConviction?: string;
  lastViolentOrDUIConviction?: string;
  employmentVerifiedDate?: string;
};

export type LSUCriteria = {
  criteriaName: string;
  reason: LSUCriteriaMet;
};

export type LSUReferralRecord = {
  stateCode: string;
  externalId: string;
  formInformation: {
    clientName: string;
  };
  reasons: LSUCriteria[];
};

export interface TransformedLSUReferral {
  stateCode: string;
  externalId: string;
  formInformation: {
    clientName: string;
  };
  criteria: {
    eligibleRiskLevel?: { riskLevel?: string; lastIncrease?: Date };
    negativeUA?: { lastNegativeUA?: Date };
    noFelonyConvictions?: { lastFelonyConviction?: Date };
    noViolentOrDUIConvictions?: { lastViolentOrDUIConviction?: Date };
    verifiedEmployment?: { employmentVerifiedDate?: Date };
  };
}
