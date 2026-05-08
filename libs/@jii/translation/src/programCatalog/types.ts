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

const commonProgramCatalogContentsSchema = z.object({
  lastUpdated: z.string(),
  backLink: z.string(),
  pageTitle: z.string(),
  resultsCount_one: z.string(),
  resultsCount_other: z.string(),
  resultsHint: z.string(),
  filters: z.object({
    button: z.string(),
    categoryLabel: z.string(),
    facilityLabel: z.string(),
    allCategories: z.string(),
    allFacilities: z.string(),
    onlyEarnCredits: z.string(),
    onlyStarred: z.string(),
    clearAll: z.string(),
  }),
  card: z.object({
    earnLabel: z.string(),
    daysOfCredit_zero: z.string(),
    daysOfCredit_one: z.string(),
    daysOfCredit_other: z.string(),
    newBadge: z.string(),
  }),
  category: z.object({
    programCount_one: z.string(),
    programCount_other: z.string(),
    programCountFiltered_one: z.string(),
    programCountFiltered_other: z.string(),
  }),
  modal: z.object({
    earnSubtitle_zero: z.string(),
    earnSubtitle_one: z.string(),
    earnSubtitle_other: z.string(),
    programDescription: z.string(),
    eligibility: z.string(),
    eligibilityPrereq: z.string(),
    eligibilityNone: z.string(),
    availableFacilities: z.string(),
    closeWindow: z.string(),
  }),
});

/**
 * Translation resources for the common namespace are expected to conform
 * to this schema — any state using Program Catalog depends on these resources.
 */
export const commonProgramCatalogResourcesSchema = z.object({
  programs: commonProgramCatalogContentsSchema,
});

export type CommonProgramCatalogResources = z.infer<
  typeof commonProgramCatalogResourcesSchema
>;

const stateOnlyProgramCatalogContentsSchema = z.object({
  pageDescription: z.string(),
  learnMoreLink: z.string(),
  modalCallToAction: z.string(),
});

/**
 * State-specific translation resources required for any state that uses the Program Catalog
 * feature. The remaining program catalog copy lives in the "common" namespace and is inherited
 * via i18next fallback. Only keys that genuinely vary between states are required here.
 */
export const stateProgramCatalogResourcesSchema = z.object({
  programs: stateOnlyProgramCatalogContentsSchema,
});

export type StateProgramCatalogResources = z.infer<
  typeof stateProgramCatalogResourcesSchema
>;

/**
 * At runtime, i18next merges the state namespace with "common" via fallbackNS. This is the
 * full shape available for selection — the union of common and state-specific keys.
 * The i18next type system doesn't infer this automatically; see WithCorrectedProgramCatalog
 * in i18next.d.ts.
 */
export const combinedProgramCatalogResourcesSchema = z.object({
  programs: commonProgramCatalogContentsSchema.merge(
    stateOnlyProgramCatalogContentsSchema,
  ),
});

export type CombinedProgramCatalogResources = z.infer<
  typeof combinedProgramCatalogResourcesSchema
>;
