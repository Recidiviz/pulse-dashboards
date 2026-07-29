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

import { Storage } from "@google-cloud/storage";
import { captureException } from "@sentry/node";
import { dsvFormat } from "d3-dsv";
import { format } from "date-fns";
import { z } from "zod";

import {
  allRNAQuestions,
  rnaCheckboxAnswersSchema,
  rnaLifeAreaAnswersSchema,
  rnaQuestionConfig,
  rnaTextAnswersSchema,
  writebackAnswers,
  writebackLifeAreaNames,
} from "~@jii/configs";
import { getPrismaClientForStateCode, PrismaClient } from "~@jii/prisma";

const completedUsNcRNASchema = z.object({
  pseudonymizedId: z.string(),
  answers: z.object({}).passthrough(),
  opusId: z.string(),
  seqNumber: z.string().nullable(),

  // These dates are nullable in the db but should not be null for values returned
  // by the query
  admitDate: z.date(),
  completedAt: z.date(),
});

const completedRNAResultSchema = z.array(completedUsNcRNASchema);
export type CompletedUsNcRNA = z.output<typeof completedUsNcRNASchema>;

export async function getCompletedUsNcRNA(prismaClient: PrismaClient) {
  const dbRecords = await prismaClient.$queryRaw`
      WITH rna_answers_with_supplemental_data AS (
      SELECT
          rna."pseudonymizedId",
          rna."answers",
          rna."completedAt",
          info."opusId",
          info."seqNumber",
          info."admitDate"
      FROM "UsNcRNA" rna
      INNER JOIN "UsNcRNAWritebackData" info
      USING ("pseudonymizedId")
  )
  SELECT DISTINCT ON ("pseudonymizedId") *
  FROM rna_answers_with_supplemental_data
  WHERE "completedAt" IS NOT NULL AND "admitDate" IS NOT NULL
  ORDER BY "pseudonymizedId", "completedAt" DESC;
  `;

  try {
    return completedRNAResultSchema.parse(dbRecords);
  } catch (e) {
    captureException(e);
    return [];
  }
}

/**
 * Given info from the db, return a processed version that corresponds to a row
 * in the CSV for writeback, in the format NC expects.
 * If this row should be skipped, return undefined.
 */
export function processRNARecord(
  queryResult: CompletedUsNcRNA,
): Record<string, string> | undefined {
  try {
    const allRawAnswers = queryResult["answers"];
    const textAnswers = rnaTextAnswersSchema.parse(allRawAnswers);
    const checkboxAnswers = rnaCheckboxAnswersSchema.parse(allRawAnswers);
    const lifeAreaAnswers = rnaLifeAreaAnswersSchema.parse(allRawAnswers);

    const questionIdsWithErrors: string[] = [];
    const processedAnswers = allRNAQuestions.flatMap((id, i) => {
      const format = rnaQuestionConfig[id].format;
      if (format === "LIFE_AREA") {
        const colNamePrefix = writebackLifeAreaNames[id];
        const answer = lifeAreaAnswers[id];

        if (!answer) {
          questionIdsWithErrors.push(id);
          return [];
        }

        const isInterested =
          id === "lifeAreaCustom" ? !!answer.customLifeArea : !!answer.interest;

        if (!isInterested) {
          return [
            [`${colNamePrefix}_Problem`, "N"],
            [`${colNamePrefix}_Interest`, ""],
            [`${colNamePrefix}_Ideas`, ""],
          ];
        }

        if (!answer.improvementText || !answer.interestRating) {
          questionIdsWithErrors.push(id);
          return [];
        }

        // Remove newlines and carriage returns from the free text entry.
        // For the custom life area, prepend the user's input for the custom life area
        // to their ideas for improvement.
        const ideaPreface = answer.customLifeArea ?? "";
        const formattedIdeas = `${ideaPreface} ${answer.improvementText}`
          .replaceAll("\n", " ")
          .replaceAll("\r", " ")
          .trim();

        return [
          [`${colNamePrefix}_Problem`, "Y"],
          [`${colNamePrefix}_Interest`, answer.interestRating],
          [`${colNamePrefix}_Ideas`, formattedIdeas],
        ];
      }

      const colName = `Q${i + 1}`;
      const writebackMapping = writebackAnswers[format];

      if (textAnswers[id]) {
        return [[colName, writebackMapping[textAnswers[id]]]];
      } else if (checkboxAnswers[id]) {
        // TODO(OBT-29547): Remove handling for this legacy answer type

        // Pick the first selected answer. There should be at least one selected answer.
        const results = Object.entries(checkboxAnswers[id]).filter(
          ([, isSelected]) => isSelected,
        );
        if (results.length > 0) {
          return [[colName, writebackMapping[results[0][0]]]];
        }
      }

      questionIdsWithErrors.push(id);
      return [];
    });

    if (questionIdsWithErrors.length > 0) {
      throw new Error(
        `Invalid or missing data for person ${queryResult.pseudonymizedId}. Question IDs: ${questionIdsWithErrors}`,
      );
    }

    return {
      "Opus#": queryResult.opusId,
      "Admit Date": format(queryResult.admitDate, "yyyy-MM-dd"),
      "Seq#": queryResult.seqNumber,
      dateAssessmentCompleted: format(queryResult.completedAt, "yyyy-MM-dd"),
      ...Object.fromEntries(processedAnswers),
    };
  } catch (e) {
    captureException(
      `Unexpected error when processing RNA writeback data: ${e}`,
    );
    return;
  }
}

/**
 * Return the file path to save writeback data to, dependent on the current timestamp.
 */
export function getFilePath(): string {
  const timestamp = format(Date.now(), "yyyy-MM-dd_HH-mm-ss");
  return `DOP_Self_Report_${timestamp}.csv`;
}

/**
 * Given an array of records, each mapping column headers to values for one row in
 * the output, writes the data as a pipe-delimited CSV to the provided NC writeback bucket.
 *
 * Returns the filepath written to.
 */
async function writeCSV(
  csvData: Record<string, string>[],
  bucket: string,
): Promise<string> {
  const data = dsvFormat("|").format(csvData);

  const filePath = getFilePath();

  const storage = new Storage();
  const file = storage.bucket(bucket).file(filePath);
  await file.save(data, { contentType: "text/csv" });

  return filePath;
}

/**
 * Reads RNA data for writeback from the JII Prisma database, and writes it in CSV format
 * to a GCS bucket (which in prod is connected to North Carolina's SFTP server)
 */
async function main() {
  const bucket = process.env["NC_WRITEBACK_BUCKET"];
  if (!bucket) {
    console.log(
      "No bucket for NC writeback found in this environment. Skipping run.",
    );
    return;
  }

  const prismaClient = getPrismaClientForStateCode("US_NC");

  console.log("Querying database...");
  const dbRecords = await getCompletedUsNcRNA(prismaClient);

  console.log("Transforming records...");
  const csvData = dbRecords
    .map(processRNARecord)
    .filter((r): r is Record<string, string> => !!r);

  console.log("Writing data to GCS...");
  const filePath = await writeCSV(csvData, bucket);
  console.log(
    `${csvData.length} record(s) written to bucket ${bucket} with file name ${filePath}`,
  );
}

main();
