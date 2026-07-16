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

import UsAzAboutVideo from "../assets/UsAzAboutVideo.mp4";
import UsAzAboutVideoCaptions from "../assets/UsAzAboutVideo.vtt";

export type OnboardingVideoAssets = {
  source: string;
  captions?: { src: string; srcLang: string; label: string };
};

/**
 * Manages state for an AboutVideoCta and associated modal.
 */
export class AboutVideoPresenter {
  videoIsOpen = false;
  userRequestedCtaHide = false;

  constructor(
    public onHomepage: boolean,
    private residentsStore: ResidentsStore,
  ) {
    makeAutoObservable(this);
  }

  /**
   * The CTA is hidden either
   * - when we're on the homepage and the user has moved the video from the homepage, or
   * - when we're not on the homepage (i.e. on the about page) and the user hasn't
   *   moved the video from the homepage.
   */
  get ctaIsHidden(): boolean {
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

  openVideo() {
    this.videoIsOpen = true;
  }

  closeVideo() {
    this.videoIsOpen = false;
  }

  get videoAssets(): OnboardingVideoAssets | undefined {
    switch (this.residentsStore.stateCode) {
      case "US_AZ":
        return {
          source: UsAzAboutVideo,
          captions: {
            src: UsAzAboutVideoCaptions,
            srcLang: "en",
            label: "English",
          },
        };
      default:
        return;
    }
  }
}
