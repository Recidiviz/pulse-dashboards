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

import {
  cleanupInlineTemplate,
  hydrateTemplate,
} from "../../configs/hydrateTemplate";
import {
  IncarcerationOpportunityId,
  OpportunityConfig,
  OpportunityRecord,
} from "../../configs/types";
import {
  EligibilityReport,
  EligibilityStatus,
  eligibilityStatusEnum,
} from "./interface";

export abstract class ReportBase {
  constructor(
    protected config: OpportunityConfig,
    protected eligibilityData: OpportunityRecord<IncarcerationOpportunityId>,
  ) {}

  get name() {
    return this.config.name;
  }

  get description() {
    return this.config.description;
  }

  get status(): { value: EligibilityStatus; label: string } {
    let value: EligibilityStatus;

    if (this.eligibilityData.isEligible) {
      value = "ELIGIBLE";
    } else if (this.eligibilityData.isAlmostEligible) {
      value = "ALMOST_ELIGIBLE";
    } else {
      value = "INELIGIBLE";
    }

    return {
      value,
      label: this.config.statusLabels[value],
    };
  }

  /**
   * Config data for sections that appear on the main page below requirements.
   * May be filtered based on eligibility status.
   */
  get enabledSections() {
    return this.config.sections.filter((sectionConfig) => {
      if (this.status.value === eligibilityStatusEnum.enum.INELIGIBLE) {
        return !sectionConfig.hideWhenIneligible;
      }
      return true;
    });
  }

  /**
   * Determines whether the highlights will be included with requirements content;
   * generally this depends on specific criteria for a given opportunity
   */
  protected abstract showHighlights: boolean;

  /**
   * Mapping of opportunity-specific data that is passed to Handlebars templates
   * for rendering the highlights content
   */
  protected abstract highlightsTemplateContext: Record<string, unknown>;

  get highlights() {
    const highlights: EligibilityReport["highlights"] = [];

    if (this.showHighlights) {
      this.config.requirements.summary.highlights.forEach(
        ({ label, value }) => {
          highlights.push({
            label,
            value: cleanupInlineTemplate(
              hydrateTemplate(value, this.highlightsTemplateContext),
            ),
          });
        },
      );
    }

    return highlights;
  }
}
