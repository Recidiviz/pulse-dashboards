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

import { LinkedInfoPageProps } from "../../../../common/components/LinkedInfoPage/LinkedInfoPage";
import { SimpleLinkProps } from "../../../../components/types";
import { State } from "../../../../routes/routes";
import { UsMaEgtCopy } from "../../configs/US_MA/copy";

export class DefinitionPagePresenter implements LinkedInfoPageProps {
  heading: string;
  body: string;
  pageLinksHeading: string;
  topLinkText: string;

  constructor(
    private pageSlug: string,
    private copy: UsMaEgtCopy,
  ) {
    const currentPage = copy.infoPages[pageSlug as keyof typeof copy.infoPages];
    if (!currentPage) {
      throw new Error(`Definition page ${pageSlug} not found`);
    }

    this.heading = currentPage.heading;
    this.body = currentPage.body;
    this.pageLinksHeading = copy.definitionsLinksHeading;
    this.topLinkText = copy.topLinkText;
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
    return Object.entries(this.copy.infoPages)
      .filter(([slug]) => slug !== this.pageSlug)
      .map(([pageSlug, page]) => ({
        text: page.heading,
        url: State.Resident.EGT.Definition.buildPath({
          ...this.baseUrlParams,
          pageSlug,
        }),
      }));
  }

  get backLink(): SimpleLinkProps {
    return {
      children: this.copy.homeLink,
      to: State.Resident.EGT.buildPath(this.baseUrlParams),
    };
  }
}
