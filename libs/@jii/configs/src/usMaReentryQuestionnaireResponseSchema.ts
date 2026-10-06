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

import { mapValues } from "lodash-es";
import { z } from "zod";

import { reentryQuestionnaireConfig } from "./usMaReentryQuestionnaireSpec";

const radioAnswerSchema = z.string().optional();
const checkboxAnswerSchema = z.array(z.string()).optional();

export const reentryQuestionnaireAnswersWriteSchema = z
  .object(
    mapValues(reentryQuestionnaireConfig, (config) =>
      config.format === "RADIO" ? radioAnswerSchema : checkboxAnswerSchema,
    ),
  )
  .strict();

// For reading stored answers: drops answers to questions the config no longer
// has, instead of rejecting the whole record like the write schema above.
export const reentryQuestionnaireAnswersReadSchema =
  reentryQuestionnaireAnswersWriteSchema.strip();

export type ReentryQuestionnaireAnswers = z.infer<
  typeof reentryQuestionnaireAnswersWriteSchema
>;
