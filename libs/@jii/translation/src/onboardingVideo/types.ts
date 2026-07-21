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

import { z } from "zod";

const commonOnboardingVideoContentsSchema = z.object({
  heading: z.string(),
  description: z.string(),
  confirmClose: z.string(),
  cancelClose: z.string(),
  videoButtonAltText: z.string(),
  closeButtonAltText: z.string(),
});

/**
 * Translation resources for the common namespace are expected to conform
 * to this schema — any state using Onboarding Video may depend on these resources.
 */
export const commonOnboardingVideoResourcesSchema = z.object({
  onboardingVideo: commonOnboardingVideoContentsSchema,
});

export type CommonOnboardingVideoResources = z.infer<
  typeof commonOnboardingVideoResourcesSchema
>;

/**
 * State translation resources that may be provided for any state that uses the Onboarding Video
 * feature.
 *
 * All default copy for this feature lives in the "common" namespace and is inherited
 * via i18next fallback, but states may optionally override any of the copy available.
 */
export const stateOnboardingVideoResourcesSchema = z.object({
  onboardingVideo: commonOnboardingVideoContentsSchema.partial().strict(),
});

/**
 * At runtime, i18next merges the state namespace with "common" via fallbackNS. No matter
 * which overrides the state namespace may specify, the types of the results will have
 * the same shape as the resources in the "common" namespace.
 *
 * The i18next type system doesn't infer this automatically; see WithCorrectedOnboardingVideo
 * in i18next.d.ts.
 */
export type CombinedOnboardingVideoResources = CommonOnboardingVideoResources;
