// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { matchPath } from "react-router-dom";

import { PageLinksFooterProps } from "~@jii/common-ui";
import { SimpleLinkProps } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { UsMaTFunction, UsMaTranslationsObject } from "~@jii/translation";

export class DefinitionPagePresenter implements PageLinksFooterProps {
  private currentPageSlug: keyof UsMaTranslationsObject["infoPages"];

  constructor(
    private pageSlug: string,
    private t: UsMaTFunction,
  ) {
    if (pageSlug in this.allInfoPagesCopy) {
      // TS can't seem to infer this but this check should ensure it
      this.currentPageSlug = pageSlug as keyof typeof this.allInfoPagesCopy;
    } else {
      throw new Error(`Definition page ${pageSlug} not found`);
    }
  }

  private get allInfoPagesCopy() {
    return this.t(($) => $.infoPages, { returnObjects: true });
  }

  get currentPage() {
    return this.allInfoPagesCopy[this.currentPageSlug];
  }

  private get baseUrlParams() {
    const urlMatch = matchPath(
      { path: State.Resident.path, end: false },
      window.location.pathname,
    );
    if (!urlMatch) throw new Error("Invalid URL");

    return State.Resident.getTypedParams(urlMatch.params);
  }

  get pageLinks() {
    return Object.entries(this.allInfoPagesCopy)
      .filter(([slug]) => slug !== this.pageSlug)
      .map(([pageSlug, page]) => ({
        text: page.heading,
        url: State.Resident.EGT.Definition.buildPath({
          ...this.baseUrlParams,
          pageSlug,
        }),
      }));
  }

  get pageLinksHeading() {
    return this.t(($) => $.definitionsLinksHeading);
  }

  get topLinkText() {
    return this.t(($) => $.topLinkText);
  }

  get backLink(): SimpleLinkProps {
    return {
      children: this.t(($) => $.homeLink),
      to: State.Resident.EGT.buildPath(this.baseUrlParams),
    };
  }
}
