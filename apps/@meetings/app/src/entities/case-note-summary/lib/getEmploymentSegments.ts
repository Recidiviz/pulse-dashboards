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

import { compact } from "lodash";

import { CaseNoteSummarySegment } from "../model/types";
import {
  citedFragment,
  citedValue,
  CniWarn,
  joinSegmentGroups,
  toSegment,
  trimLeadingSpace,
  usableField,
} from "./segmentBuilders";

const SELF_EMPLOYED = "self_employed";

const EMPLOYMENT_TYPE_FRAGMENTS = {
  employee_ft: "full-time",
  employee_pt: "part-time",
  contractor_1099: "as a contractor",
  temp_agency: "through a staffing agency",
  seasonal: "seasonally",
  intern: "as an intern",
  apprentice: "as an apprentice",
  gig: "doing gig work",
  day_labor: "doing day labor",
  cash_informal: "doing informal work",
  [SELF_EMPLOYED]: "self-employed",
};

const SEARCH_STATUS_FRAGMENTS = {
  searching: "and is actively searching for work",
  not_searching: "and is not currently searching",
};

/**
 * Builds one employer's phrase, e.g. "full-time as a cashier at Acme Corp in Boise, ID".
 */
function getEmployerPhrase(
  employer: PrismaJson.CNIEmploymentFields["employers"][number],
  warn: CniWarn,
): CaseNoteSummarySegment[] {
  const {
    employmentType,
    jobTitle,
    employerName,
    employerLocation,
    payRateAmount,
  } = employer;

  // Self-employment reorders the phrase and picks up a pay rate
  const segments =
    employmentType?.fieldValue === SELF_EMPLOYED
      ? compact([
          citedFragment(employmentType, EMPLOYMENT_TYPE_FRAGMENTS, {
            fieldKey: "employmentType",
            warn,
          }),
          citedValue(jobTitle, (value) => ` as a ${value}`),
          citedValue(employerLocation, (value) => `, in ${value}`),
          citedValue(payRateAmount, (value) => `, earning ${value}`),
        ])
      : compact([
          citedFragment(employmentType, EMPLOYMENT_TYPE_FRAGMENTS, {
            fieldKey: "employmentType",
            warn,
          }),
          citedValue(jobTitle, (value) => ` as a ${value}`),
          citedValue(employerName, (value) => ` at ${value}`),
          citedValue(employerLocation, (value) => ` in ${value}`),
        ]);

  return trimLeadingSpace(segments);
}

export function getEmploymentSegments(
  cniFields: PrismaJson.CNIEmploymentFields,
  warn: CniWarn,
): CaseNoteSummarySegment[] | null {
  const primaryStatus = usableField(cniFields.primaryStatus);

  if (!primaryStatus) {
    warn("employment summary has no primaryStatus");
    return null;
  }

  if (primaryStatus.fieldValue === "unemployed") {
    return compact([
      citedValue(primaryStatus, () => "is unemployed"),
      citedFragment(
        cniFields.searchStatus,
        SEARCH_STATUS_FRAGMENTS,
        { fieldKey: "searchStatus", warn },
        (fragment) => `, ${fragment}`,
      ),
    ]);
  }

  const employers = cniFields.employers ?? [];

  if (primaryStatus.fieldValue === "employed") {
    const phrases = employers.map((employer) =>
      getEmployerPhrase(employer, warn),
    );
    const joined = joinSegmentGroups(phrases);

    if (joined.length === 0) {
      return compact([citedValue(primaryStatus, () => "is employed")]);
    }

    // A lone self-employed employer reads "is self-employed ..." rather than the
    // doubled-up "is employed self-employed ..."
    const isSoleSelfEmployed =
      phrases.filter((phrase) => phrase.length > 0).length === 1 &&
      employers.some(
        ({ employmentType }) => employmentType?.fieldValue === SELF_EMPLOYED,
      );

    return compact([
      citedValue(primaryStatus, () =>
        isSoleSelfEmployed ? "is" : "is employed",
      ),
      toSegment(" "),
      ...joined,
    ]);
  }

  warn(`unrecognized employment primaryStatus="${primaryStatus.fieldValue}"`);
  return null;
}
