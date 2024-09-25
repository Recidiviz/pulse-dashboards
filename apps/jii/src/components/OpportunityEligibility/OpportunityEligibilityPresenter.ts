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
import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { EligibilityReport } from "../../models/EligibilityReport/interface";
import { State } from "../../routes/routes";

export class OpportunityEligibilityPresenter {
  constructor(
    private residentsStore: ResidentsStore,
    public residentExternalId: string,
    public opportunityId: IncarcerationOpportunityId,
    private config: OpportunityConfig,
    private eligibilityReport: EligibilityReport,
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
      linkUrl: State.Eligibility.Opportunity.InfoPage.buildPath({
        ...this.linkParams,
        pageSlug: urlSlug,
      }),
    };
  }

  get additionalSections() {
    return this.config.sections
      .filter((sectionConfig) => {
        // drop sections that are hidden for ineligible users, when applicable
        if (
          // for now this is a proxy for ineligible status; revisit when we add more data for those users
          !this.eligibilityReport.hasEligibilityData
        ) {
          return !sectionConfig.hideWhenIneligible;
        }
        return true;
      })
      .map((sectionConfig) => {
        const {
          summary: { heading, body },
          fullPage: { urlSlug, linkText },
        } = sectionConfig;
        return {
          heading,
          body,
          linkText,
          linkUrl: State.Eligibility.Opportunity.InfoPage.buildPath({
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
