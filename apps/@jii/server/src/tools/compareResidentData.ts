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

import { ArgumentParser } from "argparse";
import { writeFileSync } from "fs";

import { getPrismaClientForStateCode, Resident } from "~@jii/prisma";
import { findStateSchema } from "~@jii/schemas";
import { getFirestoreCollectionQuerier } from "~@jii/trpc";
import {
  WorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "~datatypes";

/**
 * Compares a sample of Firestore resident records (the legacy data source)
 * against the corresponding records in Prisma (the new data source backing
 * the `resident.getResident` tRPC endpoint), for states that have a Prisma
 * database configured.
 *
 * State-specific data (Prisma's `stateSpecificData` vs Firestore's
 * `metadata`) is compared with a generic value diff. For states whose
 * schemas have already diverged post-migration, differing field names are
 * expected -- treat those mismatches as a signal to interpret, not an
 * automatic bug report.
 *
 * Residents and states are all checked concurrently; findings are collected
 * and printed at the end (grouped and ordered by state) rather than logged
 * as they're found, so concurrent output doesn't interleave. The same
 * output is also written to a file (see --output) for easier review.
 */

const parser = new ArgumentParser({
  description:
    "Compare a sample of Firestore resident records against the new Prisma-backed data",
});

parser.add_argument("--states", {
  help: "Comma-separated state codes to check (defaults to ENABLED_STATE_DBS)",
});

parser.add_argument("--sample-size", {
  dest: "sampleSize",
  type: "int",
  default: 20,
  help: "Number of residents to sample per state, or 0 to check every resident in the state instead of sampling (default: 20)",
});

parser.add_argument("--output", {
  dest: "outputFile",
  default: "compare-resident-data-results.log",
  help: "Path to write full results to (default: compare-resident-data-results.log)",
});

type Args = {
  states?: string;
  sampleSize: number;
  outputFile: string;
};

const args = parser.parse_args() as Args;

function getStateCodesToCheck(): Array<string> {
  const source = args.states ?? process.env["ENABLED_STATE_DBS"];

  if (!source) {
    throw new Error(
      "No states specified: pass --states or set ENABLED_STATE_DBS",
    );
  }

  return source.split(",").map((s) => s.trim().toUpperCase());
}

// this maps corresponding fields in the Firestore and Prisma records,
// since not all are named the same
const CORE_FIELDS: Array<
  [string, (r: WorkflowsResidentRecord) => unknown, (r: Resident) => unknown]
> = [
  ["displayId", (r) => r.displayId, (r) => r.displayId],
  ["personExternalId", (r) => r.personExternalId, (r) => r.personExternalId],
  ["givenNames", (r) => r.personName.givenNames, (r) => r.givenNames],
  ["middleNames", (r) => r.personName.middleNames, (r) => r.middleNames],
  ["surname", (r) => r.personName.surname, (r) => r.surname],
  ["facilityId", (r) => r.facilityId, (r) => r.facilityId],
  ["unitId", (r) => r.unitId, (r) => r.unitId],
];

type StateSummary = {
  checked: number;
  missingFromPrisma: number;
  coreFieldMismatches: number;
  stateSpecificDataMismatches: number;
  ssdParseErrors: number;
};

type ResidentCheckResult = {
  checked: boolean;
  missingFromPrisma: boolean;
  coreFieldMismatch: boolean;
  stateSpecificDataMismatch: boolean;
  ssdParseError: boolean;
  messages: Array<string>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively diffs two values that are expected to share the same shape,
 * appending a message for any differing or one-sided keys. Not a
 * general-purpose deep-equal utility -- just enough to surface useful signal
 * for this comparison.
 *
 * `allowedKeys`, when given, restricts comparison at this level to those
 * keys -- used at the top level to skip fields the JII schema doesn't
 * define (e.g. workflows-only fields from the three-tier metadata split
 * that legitimately don't exist on the JII/Prisma side).
 */
function diffValues(
  path: string,
  pseudonymizedId: string,
  oldValue: unknown,
  newValue: unknown,
  messages: Array<string>,
  allowedKeys?: Set<string>,
): void {
  if (oldValue === newValue) return;

  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) {
      messages.push(
        `[compareResidentData] State-specific data mismatch for pseudonymizedId=${pseudonymizedId} ` +
          `at ${path}: array length differs (firestore=${oldValue.length}, prisma=${newValue.length})`,
      );
    }
    // items are expected to appear in the same order, so compare index-for-index
    for (let i = 0; i < Math.max(oldValue.length, newValue.length); i++) {
      diffValues(
        `${path}[${i}]`,
        pseudonymizedId,
        oldValue[i],
        newValue[i],
        messages,
      );
    }
    return;
  }

  if (isPlainObject(oldValue) && isPlainObject(newValue)) {
    const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    for (const key of keys) {
      if (allowedKeys && !allowedKeys.has(key)) continue;
      diffValues(
        `${path}.${key}`,
        pseudonymizedId,
        oldValue[key],
        newValue[key],
        messages,
      );
    }
    return;
  }

  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

  messages.push(
    `[compareResidentData] State-specific data mismatch for pseudonymizedId=${pseudonymizedId} ` +
      `at ${path}: firestore=${JSON.stringify(oldValue)}, prisma=${JSON.stringify(newValue)}`,
  );
}

async function compareResident(
  stateCode: string,
  firestoreResident: WorkflowsResidentRecord,
): Promise<ResidentCheckResult> {
  const { pseudonymizedId } = firestoreResident;
  const messages: Array<string> = [];
  const prisma = getPrismaClientForStateCode(stateCode);
  const resident = await prisma.resident.findUnique({
    where: { pseudonymizedId },
  });

  if (!resident) {
    messages.push(
      `[compareResidentData] Resident missing from Prisma for state ${stateCode}: ` +
        `pseudonymizedId=${pseudonymizedId}`,
    );
    return {
      checked: true,
      missingFromPrisma: true,
      coreFieldMismatch: false,
      stateSpecificDataMismatch: false,
      ssdParseError: false,
      messages,
    };
  }

  let coreFieldMismatch = false;
  for (const [field, getOld, getNew] of CORE_FIELDS) {
    const oldValue = getOld(firestoreResident);
    const newValue = getNew(resident);
    if (oldValue !== newValue) {
      coreFieldMismatch = true;
      messages.push(
        `[compareResidentData] Field mismatch for pseudonymizedId=${pseudonymizedId}, ` +
          `field=${field}: firestore=${JSON.stringify(oldValue)}, prisma=${JSON.stringify(newValue)}`,
      );
    }
  }

  // this is the same logic around SSD schema as is employed in trpc getResidents;
  // if a schema doesn't exist for this state, SSD is excluded from the response.
  // If it does exist, each resident's SSD must pass validation.
  const ssdSchema = findStateSchema(stateCode);
  if (!ssdSchema) {
    return {
      checked: true,
      missingFromPrisma: false,
      coreFieldMismatch,
      stateSpecificDataMismatch: false,
      ssdParseError: false,
      messages,
    };
  }

  const validation = ssdSchema.safeParse(resident.stateSpecificData);
  if (!validation.success) {
    messages.push(
      `[compareResidentData] Failed to parse stateSpecificData for pseudonymizedId=${pseudonymizedId}: ` +
        validation.error.message,
    );
    return {
      checked: true,
      missingFromPrisma: false,
      coreFieldMismatch,
      stateSpecificDataMismatch: false,
      ssdParseError: true,
      messages,
    };
  }

  // Firestore's metadata schema is a superset of the JII schema (it also
  // includes workflows-only fields from the three-tier split), so only
  // compare the fields the JII schema itself defines.
  const jiiFields = new Set(Object.keys(ssdSchema.shape));

  const ssdMessages: Array<string> = [];
  diffValues(
    "metadata",
    pseudonymizedId,
    firestoreResident.metadata,
    validation.data,
    ssdMessages,
    jiiFields,
  );
  messages.push(...ssdMessages);

  return {
    checked: true,
    missingFromPrisma: false,
    coreFieldMismatch,
    stateSpecificDataMismatch: ssdMessages.length > 0,
    ssdParseError: false,
    messages,
  };
}

async function checkState(
  stateCode: string,
  sampleSize: number,
): Promise<{ summary: StateSummary; messages: Array<string> }> {
  const residentsQuery = getFirestoreCollectionQuerier(
    stateCode,
    false,
  )("residents");

  let snapshot;
  if (sampleSize === 0) {
    // 0 means check every resident in the state instead of sampling
    snapshot = await residentsQuery.get();
  } else {
    // firebase-admin v10 doesn't support count() aggregation queries, so we
    // fetch field-less docs just to get a total count to bound a random offset
    const countSnapshot = await residentsQuery.select().get();
    const maxOffset = Math.max(0, countSnapshot.size - sampleSize);
    const offset = Math.floor(Math.random() * (maxOffset + 1));

    snapshot = await residentsQuery.offset(offset).limit(sampleSize).get();
  }

  const results = await Promise.all(
    snapshot.docs.map(async (doc): Promise<ResidentCheckResult> => {
      let firestoreResident: WorkflowsResidentRecord;
      try {
        // this is the same treatment resident records get during frontend fetch,
        // just duplicated here for simplicity
        firestoreResident = workflowsResidentRecordSchema.parse({
          ...doc.data(),
          recordId: doc.id,
        });
      } catch (e) {
        return {
          checked: false,
          missingFromPrisma: false,
          coreFieldMismatch: false,
          stateSpecificDataMismatch: false,
          ssdParseError: false,
          messages: [
            `[compareResidentData] Failed to parse Firestore resident doc ${doc.id}: ${e}`,
          ],
        };
      }

      return compareResident(stateCode, firestoreResident);
    }),
  );

  const summary: StateSummary = {
    checked: 0,
    missingFromPrisma: 0,
    coreFieldMismatches: 0,
    stateSpecificDataMismatches: 0,
    ssdParseErrors: 0,
  };
  const messages: Array<string> = [`Checking ${stateCode}`];

  for (const result of results) {
    if (result.checked) summary.checked++;
    if (result.missingFromPrisma) summary.missingFromPrisma++;
    if (result.coreFieldMismatch) summary.coreFieldMismatches++;
    if (result.stateSpecificDataMismatch) summary.stateSpecificDataMismatches++;
    if (result.ssdParseError) summary.ssdParseErrors++;
    messages.push(...result.messages);
  }

  return { summary, messages };
}

async function main() {
  const stateCodes = getStateCodesToCheck();

  const results = await Promise.all(
    stateCodes.map((stateCode) => checkState(stateCode, args.sampleSize)),
  );

  const outputLines: Array<string> = [];
  let hasAnyMismatch = false;

  stateCodes.forEach((stateCode, i) => {
    const { summary, messages } = results[i];

    messages.forEach((message) => console.error(message));
    outputLines.push(...messages);

    const summaryLine =
      `[compareResidentData] ${stateCode}: checked=${summary.checked}, ` +
      `missingFromPrisma=${summary.missingFromPrisma}, ` +
      `coreFieldMismatches=${summary.coreFieldMismatches}, ` +
      `stateSpecificDataMismatches=${summary.stateSpecificDataMismatches}, ` +
      `ssdParseErrors=${summary.ssdParseErrors}`;
    console.log(summaryLine);
    outputLines.push(summaryLine);

    if (
      summary.missingFromPrisma > 0 ||
      summary.coreFieldMismatches > 0 ||
      summary.stateSpecificDataMismatches > 0 ||
      summary.ssdParseErrors > 0
    ) {
      hasAnyMismatch = true;
    }
  });

  writeFileSync(args.outputFile, `${outputLines.join("\n")}\n`);
  console.log(
    `[compareResidentData] Full results written to ${args.outputFile}`,
  );

  if (hasAnyMismatch) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("[compareResidentData] Fatal error:", e);
  process.exitCode = 1;
});
