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

import { compact, sortBy } from "lodash";

import { CaseNoteSummarySegment } from "../model/types";
import {
  citedFragment,
  CniWarn,
  toSegment,
  usableField,
} from "./segmentBuilders";

type Payment = PrismaJson.CNIPaymentFields["payments"][number];

type Subject = { text: string; isPlural: boolean };

const THEY: Subject = { text: "They", isPlural: true };

const TYPE_LABELS = {
  fine: "fine",
  restitution: "restitution",
  court_costs: "court costs",
  supervision_fee: "supervision fee",
  programming_fee: "programming fee",
  drug_testing_fee: "drug testing fee",
  electronic_monitoring_fee: "electronic monitoring fee",
};

const WAIVED_LABELS = {
  fine: "The fine",
  restitution: "Restitution",
  court_costs: "Court costs",
  supervision_fee: "Supervision fee",
  programming_fee: "Programming fee",
  drug_testing_fee: "Drug testing fee",
  electronic_monitoring_fee: "Electronic monitoring fee",
};

// Pluralized to read naturally after "owes", e.g. "owes $150 in drug testing fees"
const UNPAID_TYPE_LABELS = {
  fine: "fine",
  restitution: "restitution",
  court_costs: "court costs",
  supervision_fee: "supervision fees",
  programming_fee: "programming fees",
  drug_testing_fee: "drug testing fees",
  electronic_monitoring_fee: "electronic monitoring fees",
};

const PLAN_FREQUENCY_FRAGMENTS = {
  weekly: "weekly",
  bi_weekly: "bi-weekly",
  monthly: "monthly",
  quarterly: "quarterly",
};

const ABILITY_TO_PAY_FRAGMENTS = {
  unable: "stated inability to pay",
  limited: "limited ability to pay",
};

function conjugate(subject: Subject, singular: string, plural: string) {
  return subject.isPlural ? plural : singular;
}

/**
 * Builds the label segment for paymentType, falling back to the raw value as the
 * spec does, e.g. "drug_testing_fee" -> " drug testing fee".
 */
function citedTypeLabel(
  labels: Record<string, string>,
  paymentType: PrismaJson.CNIField,
  warn: CniWarn,
  template: (label: string) => string = (label) => ` ${label}`,
) {
  const value = paymentType.fieldValue;
  const hasLabel = Object.hasOwn(labels, value);
  if (!hasLabel) warn(`no template label for paymentType="${value}"`);
  return toSegment(template(hasLabel ? labels[value] : value), paymentType);
}

function parseAmount(field: PrismaJson.CNIField | undefined) {
  const usable = usableField(field);
  if (!usable) return undefined;
  const amount = Number(usable.fieldValue.trim());
  return Number.isFinite(amount) ? amount : undefined;
}

/** Formats 1200 as "$1,200" and 12.5 as "$12.50". */
function formatDollars(amount: number) {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

/** Builds a segment from a numeric amount field; a value that isn't a number renders nothing. */
function citedAmount(
  field: PrismaJson.CNIField | undefined,
  template: (dollars: string) => string,
): CaseNoteSummarySegment | undefined {
  const amount = parseAmount(field);
  if (amount === undefined || !field) return undefined;
  return toSegment(template(formatDollars(amount)), field);
}

/** Builds ", paying $100 monthly", or nothing when there is no plan amount. */
function getPlanSegments(payment: Payment, warn: CniWarn) {
  const amount = citedAmount(
    payment.paymentPlanAmount,
    (dollars) => `, paying ${dollars}`,
  );
  if (!amount) return [];

  return compact([
    amount,
    citedFragment(payment.paymentPlanFrequency, PLAN_FREQUENCY_FRAGMENTS, {
      fieldKey: "paymentPlanFrequency",
      warn,
    }),
  ]);
}

/** Builds " ($300 of $500 paid)", " ($300 paid)", " ($200 remaining)", or nothing. */
function getAmountParenthetical(payment: Payment) {
  const paid = citedAmount(payment.amountPaid, (dollars) => dollars);
  const owed = citedAmount(payment.amountOwed, (dollars) => dollars);

  if (paid && owed) {
    return [
      toSegment(" ("),
      paid,
      toSegment(" of "),
      owed,
      toSegment(" paid)"),
    ];
  }
  if (paid) return [toSegment(" ("), paid, toSegment(" paid)")];
  if (owed) return [toSegment(" ("), owed, toSegment(" remaining)")];
  return [];
}

function getPaidSentence(
  payment: Payment,
  citedField: PrismaJson.CNIField,
  subject: Subject,
  warn: CniWarn,
) {
  return [
    toSegment(`${subject.text} `),
    toSegment(`${conjugate(subject, "has", "have")} paid their`, citedField),
    citedTypeLabel(TYPE_LABELS, payment.paymentType, warn),
    toSegment(" in full"),
  ];
}

function getWaivedSentence(
  payment: Payment,
  status: PrismaJson.CNIField,
  warn: CniWarn,
) {
  const verb =
    payment.paymentType.fieldValue === "court_costs" ? "have" : "has";
  return [
    citedTypeLabel(WAIVED_LABELS, payment.paymentType, warn, (label) => label),
    toSegment(` ${verb} been waived`, status),
  ];
}

function getPartialSentence(
  payment: Payment,
  status: PrismaJson.CNIField,
  subject: Subject,
  warn: CniWarn,
) {
  return [
    toSegment(`${subject.text} `),
    toSegment(
      `${conjugate(subject, "has", "have")} partially paid their`,
      status,
    ),
    citedTypeLabel(TYPE_LABELS, payment.paymentType, warn),
    ...getAmountParenthetical(payment),
    ...getPlanSegments(payment, warn),
  ];
}

function getUnpaidSentence(
  payment: Payment,
  status: PrismaJson.CNIField,
  subject: Subject,
  warn: CniWarn,
) {
  // A fine is countable, so it reads "owes a $500 fine" rather than "owes $500 in fine"
  const amountPrefix =
    payment.paymentType.fieldValue === "fine"
      ? citedAmount(payment.amountOwed, (dollars) => ` a ${dollars}`) ??
        toSegment(" a")
      : citedAmount(payment.amountOwed, (dollars) => ` ${dollars} in`);

  return compact([
    toSegment(`${subject.text} `),
    toSegment(conjugate(subject, "owes", "owe"), status),
    amountPrefix,
    citedTypeLabel(UNPAID_TYPE_LABELS, payment.paymentType, warn),
    ...getPlanSegments(payment, warn),
    citedFragment(
      payment.abilityToPay,
      ABILITY_TO_PAY_FRAGMENTS,
      { fieldKey: "abilityToPay", warn },
      (fragment) => ` and ${conjugate(subject, "has", "have")} ${fragment}`,
    ),
  ]);
}

/**
 * Builds one sentence per payment obligation, ordered by payment type, e.g.
 * "Mike Woods has paid their drug testing fee in full. They owe $500 in
 * restitution, paying $100 monthly."
 *
 * Args:
 *   cniFields: the payments summary's fields.
 *   warn: reports payments or values that matched no template.
 *   subjectName: the client's name, used by the first sentence that has a
 *     subject. Later sentences say "They". Omit it when an earlier sentence in
 *     the summary already named the client.
 */
export function getPaymentSegments(
  cniFields: PrismaJson.CNIPaymentFields,
  warn: CniWarn,
  subjectName?: string,
): CaseNoteSummarySegment[] | null {
  let nextSubject: Subject | undefined = subjectName
    ? { text: subjectName, isPlural: false }
    : undefined;

  // Waived sentences have no subject, so the name goes to the first sentence
  // that does and "They" never appears before the client is named.
  const takeSubject = () => {
    const subject = nextSubject ?? THEY;
    nextSubject = undefined;
    return subject;
  };

  const payments = sortBy(
    cniFields.payments ?? [],
    (payment) => payment.paymentType.fieldValue,
  );

  const sentences = payments.map((payment) => {
    const status = usableField(payment.paymentStatus);

    if (!status) {
      warn(`payment "${payment.paymentType.fieldValue}" has no paymentStatus`);
      return null;
    }

    // Checked before the zero-balance rule so a waived obligation isn't
    // reported as paid in full.
    if (status.fieldValue === "waived") {
      return getWaivedSentence(payment, status, warn);
    }
    if (status.fieldValue === "paid") {
      return getPaidSentence(payment, status, takeSubject(), warn);
    }
    // A zero balance cites amountOwed, since the status quote may say otherwise
    if (payment.amountOwed && parseAmount(payment.amountOwed) === 0) {
      return getPaidSentence(payment, payment.amountOwed, takeSubject(), warn);
    }
    if (status.fieldValue === "partial") {
      return getPartialSentence(payment, status, takeSubject(), warn);
    }
    if (status.fieldValue === "unpaid") {
      return getUnpaidSentence(payment, status, takeSubject(), warn);
    }

    warn(`unrecognized paymentStatus="${status.fieldValue}"`);
    return null;
  });

  const joined = compact(sentences).flatMap((sentence, index) => [
    ...(index === 0 ? [] : [toSegment(" ")]),
    ...sentence,
    toSegment("."),
  ]);

  if (joined.length === 0) return null;

  return joined.map((segment) => ({ ...segment, category: "payments" }));
}
