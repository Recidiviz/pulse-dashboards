// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { makeAutoObservable } from "mobx";

/**
 * Contains arbitrary bits of UI state that require centralized storage
 * for persistence or sharing between components
 */
export class UiStore {
  /**
   * Used to filter results on the search page, for users with access to it.
   * Storing it here will allow it to persist when navigating away from the page
   */
  selectedFacilityFilterOptionValue?: string;

  constructor() {
    makeAutoObservable(this);
  }
}