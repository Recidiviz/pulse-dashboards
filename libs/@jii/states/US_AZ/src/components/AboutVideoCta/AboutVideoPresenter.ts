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

import { makeAutoObservable } from "mobx";

import { ResidentsStore } from "~@jii/data";

/**
 * Manages state for an AboutVideoCta and associated modal.
 */
export class AboutVideoPresenter {
  videoIsOpen = false;
  userRequestedCtaHide = false;

  constructor(
    public onHomepage: boolean,
    private usAzFslImprovements: boolean | undefined,
    private residentsStore: ResidentsStore,
  ) {
    makeAutoObservable(this);
  }

  /**
   * The CTA is hidden either
   * - when we're on the homepage and the user has moved the video from the homepage, or
   * - when we're not on the homepage (i.e. on the about page) and the user hasn't
   *   moved the video from the homepage.
   *
   * The CTA is also hidden if the user doesn't have the `usAzFslImprovements` resident
   * flag.
   */
  get ctaIsHidden(): boolean {
    if (!this.usAzFslImprovements) return true;

    const userMovedVideo =
      !!this.residentsStore.userProperties?.hideAboutVideoFromHomePage;
    return (
      (this.onHomepage && userMovedVideo) ||
      (!this.onHomepage && !userMovedVideo)
    );
  }

  async hideCta() {
    await this.residentsStore.hideAboutVideoFromHomePage();
  }
}
