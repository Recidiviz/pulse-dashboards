// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import { parseViolationRecord } from "./violationRecord";
import { translate } from "../../../../../views/tenants/utils/i18nSettings";

const sumViolationRecords = (records) =>
  Object.values(records).reduce((acc, record) => acc + record, 0);

export function compareViolationRecords(aRecordLabel, bRecordLabel) {
  const aRecords = parseViolationRecord(aRecordLabel);
  const bRecords = parseViolationRecord(bRecordLabel);

  const aSum = sumViolationRecords(aRecords);
  const bSum = sumViolationRecords(bRecords);
  if (!aSum || !bSum) return aSum - bSum;

  const violationsBySeverity = translate("violationsBySeverity");

  const aMostSevereViolation = violationsBySeverity.find(
    (violation) => aRecords[violation]
  );
  const bMostSevereViolation = violationsBySeverity.find(
    (violation) => bRecords[violation]
  );

  const aMostSevereViolationIndex = violationsBySeverity.indexOf(
    aMostSevereViolation
  );
  const bMostSevereViolationIndex = violationsBySeverity.indexOf(
    bMostSevereViolation
  );

  if (aMostSevereViolationIndex !== bMostSevereViolationIndex) {
    return bMostSevereViolationIndex - aMostSevereViolationIndex;
  }

  const aMostSevereViolationCount = aRecords[aMostSevereViolation];
  const bMostSevereViolationCount = bRecords[bMostSevereViolation];
  if (aMostSevereViolationCount !== bMostSevereViolationCount) {
    return aMostSevereViolationCount - bMostSevereViolationCount;
  }

  return aSum - bSum;
}
