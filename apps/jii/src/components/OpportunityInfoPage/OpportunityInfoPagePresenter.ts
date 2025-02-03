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

import { OpportunityConfig } from "../../configs/types";
import { EligibilityReport } from "../../models/EligibilityReport/interface";

/**
 * Reads the specified static page content out of the opportunity config
 */
export class OpportunityInfoPagePresenter {
  constructor(
    private opportunityConfig: OpportunityConfig,
    private pageSlug: string,
    private eligibilityReport: EligibilityReport,
  ) {
    makeAutoObservable(this);
  }

  private get pageConfig() {
    const config = [
      this.opportunityConfig.requirements,
      ...this.opportunityConfig.sections,
    ].find((s) => s.fullPage?.urlSlug === this.pageSlug);

    // in practice we don't really expect this to happen, mostly for type safety
    if (!config || !config.fullPage) {
      throw new Error(`No contents found for page ${this.pageSlug}`);
    }
    return config.fullPage;
  }

  get heading() {
    return this.pageConfig.heading;
  }

  /**
   * Page contents as a single string (presumably Markdown to be rendered to HTML)
   */
  get body() {
    return this.pageConfig.body;
  }

  get pageLinksHeading() {
    return `Learn more about ${this.opportunityConfig.shortName}`;
  }

  /**
   * used for bottom-of-page navigation to other info pages
   */
  get pageLinks(): Array<{ text: string; url: string }> {
    return [
      this.opportunityConfig.requirements.fullPage,
      ...this.eligibilityReport.enabledSections.map((s) => s.fullPage),
    ]
      .filter((c) => c !== undefined)
      .filter((c) => c.urlSlug !== this.pageConfig.urlSlug)
      .map((c) => ({
        // intentionally using the page title here rather than the link text,
        // which is for the buttons on the main eligibility page
        text: c.heading,
        url: `../${c.urlSlug}`,
      }));
  }
}
