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
import { UsNeTFunction } from "~@jii/translation";

import { UsNeInfoPageSlugs } from "./types";

export class DefinitionPagePresenter implements PageLinksFooterProps {
  heading: string;
  body: string;
  pageLinksHeading: string;
  topLinkText: string;

  constructor(
    private pageSlug: UsNeInfoPageSlugs,
    private t: UsNeTFunction,
  ) {
    const page = t(($) => $.infoPages[pageSlug], { returnObjects: true });

    this.heading = page.heading;
    this.body = page.body;
    this.pageLinksHeading = t(($) => $.definitionsLinksHeading);
    this.topLinkText = t(($) => $.topLinkText);
  }

  private get baseUrlParams() {
    const urlMatch = matchPath(
      { path: State.Resident.path, end: false },
      window.location.pathname,
    );
    if (!urlMatch) throw new Error("Invalid URL");

    return State.Resident.getTypedParams(urlMatch.params);
  }

  get pageLinks(): Array<SimpleLinkProps> {
    const infoPages = this.t(($) => $.infoPages, { returnObjects: true });
    return Object.entries(infoPages)
      .filter(([slug]) => slug !== this.pageSlug)
      .map(([pageSlug, { heading }]) => ({
        children: heading,
        to: State.Resident.UsNeMoreInformation.buildPath({
          ...this.baseUrlParams,
          pageSlug: pageSlug as keyof typeof infoPages,
        }),
      }));
  }

  get backLink(): SimpleLinkProps {
    return {
      children: this.t(($) => $.homeLink),
      to: State.Resident.buildPath(this.baseUrlParams),
    };
  }
}
