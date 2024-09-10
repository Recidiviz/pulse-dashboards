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

import { flowResult, makeAutoObservable } from "mobx";

import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { stateConfigsByStateCode } from "../../configs/stateConstants";
import {
  IncarcerationOpportunityId,
  OpportunityConfig,
} from "../../configs/types";
import { ResidentsStore } from "../../datastores/ResidentsStore";
import { EligibilityReport } from "../../models/EligibilityReport/interface";
import { State } from "../../routes/routes";

export class OpportunityEligibilityPresenter implements Hydratable {
  private hydrationSource: HydratesFromSource;

  constructor(
    private residentsStore: ResidentsStore,
    public residentExternalId: string,
    public opportunityId: IncarcerationOpportunityId,
    private config: OpportunityConfig,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrationSource = new HydratesFromSource({
      populate: () =>
        flowResult(
          this.residentsStore.populateEligibilityReportByResidentId(
            this.residentExternalId,
            this.opportunityId,
            this.config,
          ),
        ),
      expectPopulated: [this.expectReportPopulated],
    });
  }

  private expectReportPopulated() {
    if (
      !this.residentsStore.isResidentEligibilityReportPopulated(
        this.residentExternalId,
        this.opportunityId,
      )
    ) {
      throw new Error(
        `Failed to populate ${this.opportunityId} eligibility report for ${this.residentExternalId}`,
      );
    }
  }

  get hydrationState() {
    return this.hydrationSource.hydrationState;
  }

  hydrate() {
    return this.hydrationSource.hydrate();
  }

  /**
   * This will throw an error if it is accessed before the presenter is hydrated;
   * for convenient type safety downstream it will require that the report actually exist
   */
  private get eligibilityReport(): EligibilityReport {
    const report = this.residentsStore.residentEligibilityReportsByExternalId
      .get(this.residentExternalId)
      ?.get(this.opportunityId);

    if (!report) {
      throw new Error(
        `${this.opportunityId} EligibilityReport is missing for resident ${this.residentExternalId}`,
      );
    }

    return report;
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
      opportunitySlug: this.config.urlSection,
    };
  }

  get aboutContent() {
    return {
      ...this.config.copy.about,
      linkUrl: State.Eligibility.Opportunity.About.buildPath(this.linkParams),
    };
  }

  get nextStepsContent() {
    // this content is not relevant for ineligible residents and should be suppressed
    if (!this.eligibilityReport.hasEligibilityData) return;

    return {
      ...this.config.copy.nextSteps,
      linkUrl: State.Eligibility.Opportunity.NextSteps.buildPath(
        this.linkParams,
      ),
    };
  }

  get requirementsContent() {
    const { requirements: sections } = this.eligibilityReport;

    const {
      copy: {
        requirements: { title, linkText },
      },
    } = this.config;

    return {
      title,
      sections,
      linkText,
      linkUrl: State.Eligibility.Opportunity.Requirements.buildPath(
        this.linkParams,
      ),
    };
  }

  get htmlTitle() {
    return this.config.htmlTitle;
  }
}
