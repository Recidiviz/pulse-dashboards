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
import { opportunityIdFromUrl } from "../utils/opportunityIdFromUrl";
import { PageId } from "./types";

/**
 * Reads the specified static page content out of the opportunity config
 */
export class StaticPagePresenter {
  constructor(
    private url: string,
    private pageId: PageId,
    private residentsStore: ResidentsStore,
  ) {
    makeAutoObservable(this);
  }

  private get id() {
    return opportunityIdFromUrl(this.url, this.residentsStore);
  }

  private get config() {
    return opportunityConfigFromId(this.id, this.residentsStore);
  }

  /**
   * Full page contents as a single string (presumably Markdown to be rendered to HTML)
   */
  get contents() {
    return this.config.copy[this.pageId].fullPage;
  }
}
