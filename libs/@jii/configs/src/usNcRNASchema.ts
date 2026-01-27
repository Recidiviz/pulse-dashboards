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

import { mapValues } from "lodash";
import { z } from "zod";

import {
  rnaCheckboxQuestionConfig,
  rnaLifeAreaQuestionConfig,
  RNAQuestionId,
  rnaTextQuestionConfig,
} from "~@jii/configs";

const textSchema = z.string().optional();
export const rnaTextAnswersSchema = z.object(
  mapValues(rnaTextQuestionConfig, () => textSchema),
);

const checkboxSchema = z.record(z.string(), z.boolean().optional()).optional();
export const rnaCheckboxAnswersSchema = z.object(
  mapValues(rnaCheckboxQuestionConfig, () => checkboxSchema),
);

const lifeAreaAnswerSchema = z.object({
  interest: z.boolean().optional(),
  customLifeArea: z.string().optional(),
  interestRating: z.string().optional(),
  improvementText: z.string().optional(),
});
export type LifeAreaAnswer = z.infer<typeof lifeAreaAnswerSchema>;
export const rnaLifeAreaAnswersSchema = z.object(
  mapValues(rnaLifeAreaQuestionConfig, () => lifeAreaAnswerSchema.optional()),
);

export type RNATextAnswers = Partial<
  Record<RNAQuestionId, z.infer<typeof textSchema>>
>;
export type RNACheckboxAnswers = Partial<
  Record<RNAQuestionId, z.infer<typeof checkboxSchema>>
>;
export type RNALifeAreaAnswers = Partial<
  Record<RNAQuestionId, z.infer<typeof lifeAreaAnswerSchema>>
>;
