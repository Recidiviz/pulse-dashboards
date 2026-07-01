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

import { TFunction } from "i18next";
import { PickByValue } from "utility-types";

import type {
  I18nResources,
  StateProgramCatalogResources,
} from "~@jii/translation";
import type { JiiResidentAppRouterOutputs } from "~@jii/trpc-types";

export type Program =
  JiiResidentAppRouterOutputs["resident"]["getPrograms"][number];

export type StateCodeWithProgramCatalog = keyof PickByValue<
  I18nResources,
  StateProgramCatalogResources
>;

export type TFn = TFunction<[StateCodeWithProgramCatalog, "common"]>;

export type ProgramCatalogProps = {
  stateCode: StateCodeWithProgramCatalog;

  /**
   * Floor date for the lastUpdatedDate computation — the date this state's
   * program data was first loaded. When absent, lastUpdatedDate uses only
   * program.dateAddedOrUpdated values with no floor.
   * Callers can construct this with parseISO("YYYY-MM-DD").
   */
  dataLoadBaselineDate?: Date;

  /**
   * Enables all earned-time UI:
   *   - ProgramCard bottom section (earn label, days count, "New" badge)
   *   - FilterPanel "Only show earn credits" checkbox
   *   - ProgramDetailModal earn subtitle
   */
  showCredits: boolean;

  /**
   * Enables star/favorite UI:
   *   - StarButton on ProgramCard and ProgramDetailModal
   *   - FilterPanel "Only show starred" checkbox
   */
  showStars: boolean;

  /** Pre-built href for the "Learn more" ButtonLink. */
  learnMoreHref: string;

  /**
   * If present, a BackLink is rendered above the page header.
   * The label comes from t(($) => $.programs.backLink).
   */
  backHref?: string;

  /**
   * Whether category sections are expanded on initial render.
   * Defaults to true.
   */
  defaultExpanded?: boolean;
};
