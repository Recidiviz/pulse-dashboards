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

import { slugify } from "markdown-to-jsx";
import { makeAutoObservable } from "mobx";

import { stateConfigsByStateCode } from "../../configs/stateConstants";
import { OpportunityConfig } from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { EligibilityReport } from "../../models/EligibilityReport/types";
import { State } from "../../routes/routes";
import { LinkProps } from "../ResidentsLayoutRoute/NavigationMenuPresenter";

export class OpportunityEligibilityPresenter {
  constructor(
    private residentsStore: ResidentsStore,
    private config: OpportunityConfig,
    private eligibilityReport: EligibilityReport,
    private residentPseudoId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get title() {
    return this.eligibilityReport.name;
  }

  get status() {
    return this.eligibilityReport.status;
  }

  private get linkParams() {
    return {
      stateSlug: stateConfigsByStateCode[this.residentsStore.stateCode].urlSlug,
      opportunitySlug: this.config.urlSlug,
      personPseudoId: this.residentPseudoId,
    };
  }

  get requirementsContent() {
    const { status, requirements: sections } = this.eligibilityReport;

    if (status.value === "NA") return;

    const {
      requirements: {
        summary: { heading },
        fullPage,
      },
    } = this.config;

    const { linkText, urlSlug } = fullPage ?? {};
    return {
      id: slugify(heading),
      heading,
      sections,
      linkText,
      linkUrl:
        urlSlug &&
        State.Resident.Eligibility.Opportunity.InfoPage.buildPath({
          ...this.linkParams,
          pageSlug: urlSlug,
        }),
    };
  }

  get additionalSections() {
    return this.eligibilityReport.enabledSections.map((sectionConfig) => {
      const {
        summary: { heading, body },
        fullPage: { urlSlug, linkText },
      } = sectionConfig;
      return {
        id: slugify(heading),
        heading,
        body,
        linkText,
        linkUrl: State.Resident.Eligibility.Opportunity.InfoPage.buildPath({
          ...this.linkParams,
          pageSlug: urlSlug,
        }),
      };
    });
  }

  get tableOfContentsLinks(): Array<LinkProps> {
    const links = [
      ...this.additionalSections.map((section) => ({
        children: section.heading,
        to: `#${section.id}`,
      })),
    ];

    if (this.requirementsContent) {
      links.unshift({
        children: this.requirementsContent.heading,
        to: `#${this.requirementsContent.id}`,
      });
    }

    return links;
  }

  get pageBackgroundStyle() {
    let colors;

    switch (this.status.value) {
      case "ELIGIBLE":
        colors = ["rgba(0, 196, 157, 0.08)", "rgba(255, 255, 255, 0.08)"];
        break;
      case "ALMOST_ELIGIBLE":
        colors = ["rgba(252, 206, 68, 0.2)", "rgba(255, 255, 255, 0.2)"];
        break;
      case "INELIGIBLE":
        colors = ["rgba(0, 77, 72, 0.06)", "rgba(255, 255, 255, 0.06)"];
        break;
    }

    return colors
      ? `linear-gradient(
      180deg,
      ${colors[0]} 0%,
      ${colors[1]} 100%
    )`
      : "none";
  }

  get highlights() {
    if (this.eligibilityReport.highlights.length) {
      return this.eligibilityReport.highlights;
    }
    return undefined;
  }
}
