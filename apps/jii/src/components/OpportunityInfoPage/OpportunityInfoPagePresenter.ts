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

import { ResidentsStore } from "../../datastores/ResidentsStore";
import { opportunityConfigFromId } from "../utils/opportunityConfigFromId";
import { opportunityIdFromSlug } from "../utils/opportunityIdFromUrl";

/**
 * Reads the specified static page content out of the opportunity config
 */
export class OpportunityInfoPagePresenter {
  constructor(
    private opportunitySlug: string,
    private pageSlug: string,
    private residentsStore: ResidentsStore,
  ) {
    makeAutoObservable(this);
  }

  private get id() {
    return opportunityIdFromSlug(this.opportunitySlug, this.residentsStore);
  }

  private get config() {
    return opportunityConfigFromId(this.id, this.residentsStore);
  }

  private get pageConfig() {
    const config = [this.config.requirements, ...this.config.sections].find(
      (s) => s.fullPage.urlSlug === this.pageSlug,
    );
    // in practice we don't really expect this to happen, mostly for type safety
    if (!config) {
      throw new Error(`No contents found for page ${this.pageSlug}`);
    }
    return config.fullPage;
  }

  get heading() {
    return this.pageConfig.heading;
  }

  /**
   * Page contents as a single string (presumably Markdown to be rendered to HTML)
   */
  get body() {
    return this.pageConfig.body;
  }
}
