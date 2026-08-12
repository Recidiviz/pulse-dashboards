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

import * as Sentry from "@sentry/react-native";
import { compact } from "lodash";

import { Person } from "~@meetings/app/shared/api";

import { EmploymentSummary, HousingSummary } from "../model/types";
import { getEmploymentSegments } from "./getEmploymentSegments";
import { getHousingSegments } from "./getHousingSegments";
import { CniWarn, toSegment } from "./segmentBuilders";

type Args = {
  housing?: HousingSummary;
  employment?: EmploymentSummary;
  person: Person;
};

/**
 * Composes a client's case note insights into one renderable sentence:
 * `[ClientName] [EmploymentFragment][, HousingFragment].`
 */
export function getCaseNoteSummarySegments({
  housing,
  employment,
  person,
}: Args) {
  const clientId = String(person.personId ?? "unknown");

  const warn: CniWarn = (reason) =>
    Sentry.logger.warn("case_note_summary.template_gap", { clientId, reason });

  const fragments = [
    employment ? getEmploymentSegments(employment.cniFields, warn) : undefined,
    housing ? getHousingSegments(housing.cniFields, warn) : undefined,
  ];

  // filter empty fragments, join with ", "
  const joined = compact(fragments).flatMap((fragment, index) =>
    index === 0 ? fragment : [toSegment(", "), ...fragment],
  );

  if (joined.length === 0) {
    warn("no sentence template matched any summary category");
    return null;
  }

  return [toSegment(`${person.fullName} `), ...joined, toSegment(".")];
}
