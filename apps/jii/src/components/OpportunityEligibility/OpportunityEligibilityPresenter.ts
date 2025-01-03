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

import { stateConfigsByStateCode } from "../../configs/stateConstants";
import { OpportunityConfig } from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { EligibilityReport } from "../../models/EligibilityReport/interface";
import { State } from "../../routes/routes";

export class OpportunityEligibilityPresenter {
  constructor(
    private residentsStore: ResidentsStore,
    private config: OpportunityConfig,
    private eligibilityReport: EligibilityReport,
    private residentPseudoId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get headline() {
    return this.eligibilityReport.headline;
  }

  get subheading() {
    return this.eligibilityReport.subheading;
  }

  private get linkParams() {
    return {
      stateSlug: stateConfigsByStateCode[this.residentsStore.stateCode].urlSlug,
      opportunitySlug: this.config.urlSlug,
      personPseudoId: this.residentPseudoId,
    };
  }

  get summaryContent() {
    return this.config.summary;
  }

  get requirementsContent() {
    const { requirements: sections } = this.eligibilityReport;

    const {
      requirements: {
        summary: { heading },
        fullPage: { linkText, urlSlug },
      },
    } = this.config;

    return {
      heading,
      sections,
      linkText,
      linkUrl: State.Resident.Eligibility.Opportunity.InfoPage.buildPath({
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

  get htmlTitle() {
    return this.config.htmlTitle;
  }
}
