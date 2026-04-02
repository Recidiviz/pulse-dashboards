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

import { ValidationError } from "~@meetings/tasks/types";

type PipelineErrorOptions = {
  message?: string;
  validationErrorType?: ValidationError;
};

export class TranscriptValidationError extends Error {
  validationErrorType?: ValidationError;

  constructor({ message, validationErrorType }: PipelineErrorOptions) {
    super(message ?? "Transcript validation failed");
    this.name = "TranscriptValidationError";
    this.validationErrorType = validationErrorType;
  }
}
