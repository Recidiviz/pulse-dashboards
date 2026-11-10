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
 * `userCaused` takes effect only where the error is created on the main
 * thread; thrown inside a Piscina worker it arrives as a plain `Error`.
 */
export class PdfProcessingError extends Error {
  /** The uploaded document caused the failure, so it is not reported to Sentry. */
  readonly userCaused: boolean;

  constructor(
    message: string,
    options?: ErrorOptions & { userCaused?: boolean },
  ) {
    super(message, options);
    this.name = "PdfProcessingError";
    this.userCaused = options?.userCaused ?? false;
  }
}
