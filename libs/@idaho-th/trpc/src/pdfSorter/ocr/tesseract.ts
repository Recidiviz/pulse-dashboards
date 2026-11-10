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

import { execFile, type ExecFileException, spawn } from "node:child_process";

/**
 * Run Tesseract with PGM bytes on stdin.
 * OMP thread limits keep total CPU usage bounded when multiple workers run OCR.
 */
export function runTesseractOcr(pgm: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "tesseract",
      ["stdin", "stdout", "--psm", "6", "--oem", "3"],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          OMP_NUM_THREADS: "1",
          OMP_THREAD_LIMIT: "1",
        },
      },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`tesseract exited ${code}: ${stderr.trim()}`));
        return;
      }
      resolve(stdout);
    });

    child.stdin.end(pgm);
  });
}

export function checkTesseractAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(
      "tesseract",
      ["--version"],
      { encoding: "utf8", maxBuffer: 1024 * 1024 } as Parameters<
        typeof execFile
      >[2],
      (error: ExecFileException | null) => {
        resolve(!error);
      },
    );
  });
}
