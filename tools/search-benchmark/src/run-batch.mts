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

/**
 * Batch runner: drives benchmark-search.mts over a list of state/facility
 * pairs, then appends each facility's per-trial memory/time to a running
 * summary CSV as soon as its run finishes.
 *
 * Usage:
 *   nx run tools:search-benchmark-batch -- --input=fixtures/facilities.csv --trials=5 --label=firestore
 *
 * Input CSV format (header required):
 *   state,facility
 *   AZ,LEWIS
 *   AR,OUACHITA RIVER CORRECTIONAL UNIT
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { RESULTS_DIR } from "./config.mts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Facility {
  state: string;
  facility: string;
}

interface SummaryRow {
  fields: string[];
  isError: boolean;
}

function arg(name: string, fallback: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=").slice(1).join("=") : fallback;
}

const INPUT_PATH = path.resolve(arg("input", "facilities.csv"));
const TRIALS = arg("trials", "5");
const LABEL = arg("label", "firestore");
const SUMMARY_CSV = path.join(RESULTS_DIR, `batch_summary-${LABEL}.csv`);

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

function parseFacilitiesCsv(filePath: string): Facility[] {
  const lines = fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const [header, ...rows] = lines;
  if (header === undefined) {
    throw new Error(`Input CSV is empty: ${filePath}`);
  }
  const cols = parseCsvLine(header).map((c) => c.trim().toLowerCase());
  const stateIdx = cols.indexOf("state");
  const facilityIdx = cols.indexOf("facility");
  if (stateIdx === -1 || facilityIdx === -1) {
    throw new Error(
      `Input CSV must have "state" and "facility" columns, got: ${header}`,
    );
  }
  return rows.map((line) => {
    const parts = parseCsvLine(line);
    const state = parts[stateIdx];
    const facility = parts[facilityIdx];
    if (state === undefined || facility === undefined) {
      throw new Error(
        `Malformed CSV row, expected state and facility columns: ${line}`,
      );
    }
    return { state: state.trim(), facility: facility.trim() };
  });
}

function runBenchmark(state: string, facility: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "tsx",
      [
        "benchmark-search.mts",
        `--trials=${TRIALS}`,
        `--label=${LABEL}`,
        `--state=${state}`,
        `--facility=${facility}`,
      ],
      { cwd: __dirname },
    );

    let stdout = "";
    child.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `benchmark-search.mts exited with code ${code} for ${state}/${facility}`,
          ),
        );
        return;
      }
      const match = stdout.match(/Full results: (.+\.json)/);
      const resultPath = match?.[1];
      if (resultPath === undefined) {
        reject(
          new Error(
            `Could not find output path in stdout for ${state}/${facility}`,
          ),
        );
        return;
      }
      resolve(resultPath.trim());
    });
  });
}

function csvField(value: string): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// A row counts as failed/incomplete if it's the short 2-field ERROR row, or
// if any trial's Memory/Time pair was left blank (i.e. that trial failed).
function rowIsIncomplete(fields: string[]): boolean {
  if (fields.length <= 2) return true;
  for (let i = 1; i < fields.length; i += 2) {
    if (fields[i] === "" || fields[i + 1] === "") return true;
  }
  return false;
}

// Loads any prior summary CSV so a re-run can skip rows that already
// succeeded and only retry the ones that errored, are incomplete, or never ran.
function loadExistingSummary(): {
  rows: Map<string, SummaryRow>;
  maxTrials: number;
} {
  const rows = new Map<string, SummaryRow>();
  let maxTrials = 0;
  if (fs.existsSync(SUMMARY_CSV)) {
    const lines = fs
      .readFileSync(SUMMARY_CSV, "utf8")
      .split("\n")
      .filter(Boolean);
    const dataLines = lines.slice(2); // skip the two header rows
    for (const line of dataLines) {
      const fields = parseCsvLine(line);
      const key = fields[0];
      if (key === undefined) continue;
      const isError = rowIsIncomplete(fields);
      if (!isError) {
        maxTrials = Math.max(maxTrials, (fields.length - 1) / 2);
      }
      rows.set(key, { fields, isError });
    }
  }
  return { rows, maxTrials };
}

interface TrialData {
  ok: boolean;
  heapPeakMB: number;
  measures: { "search-duration": number };
  error?: string;
  firestoreErrors?: { text: string }[];
}

function buildRow(
  state: string,
  facility: string,
  resultJsonPath: string,
  maxTrials: number,
): string[] {
  const data: { results: TrialData[] } = JSON.parse(
    fs.readFileSync(resultJsonPath, "utf8"),
  );
  const trials = data.results;
  const row = [`${state}-${facility}`];
  for (let i = 0; i < maxTrials; i++) {
    const trial = trials[i];
    if (trial && trial.ok) {
      row.push(
        trial.heapPeakMB.toFixed(2),
        trial.measures["search-duration"].toFixed(1),
      );
    } else if (trial) {
      const errMsg =
        trial.error || trial.firestoreErrors?.[0]?.text || "unknown error";
      row.push(`ERROR: ${errMsg}`, "");
    } else {
      row.push("", "");
    }
  }
  return row;
}

function writeSummary(
  facilities: Facility[],
  rowsMap: Map<string, SummaryRow>,
  maxTrials: number,
): void {
  const headerTop = ["File"];
  const headerSub = [""];
  for (let i = 1; i <= maxTrials; i++) {
    headerTop.push(`Attempt ${i}`, "");
    headerSub.push("Memory (MB)", "Time (ms)");
  }
  const lines = [headerTop.join(","), headerSub.join(",")];
  for (const { state, facility } of facilities) {
    const key = `${state}-${facility}`;
    const entry = rowsMap.get(key);
    if (!entry) continue;
    lines.push(entry.fields.map(csvField).join(","));
  }
  fs.writeFileSync(SUMMARY_CSV, lines.join("\n") + "\n");
}

(async () => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const facilities = parseFacilitiesCsv(INPUT_PATH);
  const { rows: rowsMap, maxTrials: existingMaxTrials } = loadExistingSummary();
  let maxTrials = Math.max(existingMaxTrials, parseInt(TRIALS, 10) || 0, 5);

  const toRun = facilities.filter(({ state, facility }) => {
    const entry = rowsMap.get(`${state}-${facility}`);
    return !entry || entry.isError;
  });
  const skipped = facilities.length - toRun.length;

  console.log(
    `Running ${toRun.length} facilities from ${INPUT_PATH}, trials=${TRIALS}, label=${LABEL}` +
      (skipped ? ` (skipping ${skipped} already completed)` : ""),
  );

  for (const { state, facility } of toRun) {
    console.log(`\n=== ${state} / ${facility} ===`);
    try {
      // eslint-disable-next-line no-await-in-loop -- facilities must run sequentially, not concurrently
      const resultPath = await runBenchmark(state, facility);
      const row = buildRow(state, facility, resultPath, maxTrials);
      if (row.length - 1 > maxTrials * 2) {
        maxTrials = (row.length - 1) / 2;
      }
      rowsMap.set(`${state}-${facility}`, { fields: row, isError: false });
      console.log(`Recorded ${state}/${facility}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`FAILED ${state}/${facility}: ${message}`);
      rowsMap.set(`${state}-${facility}`, {
        fields: [`${state}-${facility}`, `ERROR: ${message}`],
        isError: true,
      });
    }
    writeSummary(facilities, rowsMap, maxTrials);
  }

  console.log(`\nBatch complete. Summary: ${SUMMARY_CSV}`);
})();
