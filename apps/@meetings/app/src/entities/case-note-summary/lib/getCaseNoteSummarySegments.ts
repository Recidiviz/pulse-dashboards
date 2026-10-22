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
import { formatPersonName } from "~@meetings/app/shared/lib/format";

import {
  EmploymentSummary,
  HousingSummary,
  PaymentSummary,
} from "../model/types";
import { getEmploymentSegments } from "./getEmploymentSegments";
import { getHousingSegments } from "./getHousingSegments";
import { getPaymentSegments } from "./getPaymentSegments";
import { CniWarn, toSegment } from "./segmentBuilders";

type Args = {
  housing?: HousingSummary;
  employment?: EmploymentSummary;
  payments?: PaymentSummary;
  person: Person;
};

/**
 * Composes a client's case note insights into renderable sentences:
 * "[ClientName] [EmploymentFragment][, HousingFragment]. [PaymentSentences]"
 */
export function getCaseNoteSummarySegments({
  housing,
  employment,
  payments,
  person,
}: Args) {
  const clientId = String(person.personId ?? "unknown");
  const clientName = formatPersonName(person.fullName);

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

  const leadSentence =
    joined.length > 0
      ? [toSegment(`${clientName} `), ...joined, toSegment(".")]
      : undefined;

  // Payment sentences name the client only when no lead sentence already did
  const paymentSentences = payments
    ? getPaymentSegments(
        payments.cniFields,
        warn,
        leadSentence ? undefined : clientName,
      )
    : undefined;

  const sentences = compact([leadSentence, paymentSentences]);

  if (sentences.length === 0) {
    warn("no sentence template matched any summary category");
    return null;
  }

  return sentences.flatMap((sentence, index) =>
    index === 0 ? sentence : [toSegment(" "), ...sentence],
  );
}
