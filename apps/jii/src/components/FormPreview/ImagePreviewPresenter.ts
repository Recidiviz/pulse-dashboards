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
import { formImageUrlsByOpportunity } from "./formImageUrlsByOpportunity";

export class ImagePreviewPresenter {
  private index = 0;

  constructor(
    private url: string,
    private residentsStore: ResidentsStore,
  ) {
    makeAutoObservable(this);
  }

  private get id() {
    const id = this.residentsStore.opportunityIdsByUrl.get(this.url);
    if (!id) {
      throw new Error(`No opportunity ID matches url ${this.url}`);
    }
    return id;
  }

  private get opportunityConfig() {
    const config =
      this.residentsStore.config.incarcerationOpportunities[this.id];
    if (!config) {
      throw new Error(`Missing config for ${this.id}`);
    }
    return config;
  }

  get title() {
    return this.opportunityConfig.copy.formPreview.title;
  }

  private get imageUrls() {
    const urls = formImageUrlsByOpportunity[this.id];
    if (!urls) {
      throw new Error(
        `No form image previews found for opportunity ${this.id}`,
      );
    }
    return urls;
  }

  get totalPages() {
    return this.imageUrls.length;
  }

  get currentUrl() {
    return this.imageUrls[this.index];
  }

  get currentPage() {
    return this.index + 1;
  }

  next() {
    this.index = (this.index + 1) % this.totalPages;
  }

  previous() {
    let newIndex = (this.index - 1) % this.totalPages;
    if (newIndex < 0) {
      newIndex = newIndex + this.totalPages;
    }
    this.index = newIndex;
  }
}
