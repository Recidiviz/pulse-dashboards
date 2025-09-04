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

import { mapValues } from "lodash";

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
  RequirementsByStatus,
  RequirementsSectionContent,
} from "./types";

export abstract class ReportBase<OppType extends IncarcerationOpportunityId> {
  constructor(
    protected config: OpportunityConfig,
    protected eligibilityData: OpportunityRecord<OppType>,
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
   * Groups tracked requirements by their eligibility status. For most opportunities,
   * these are expected to mirror the criteria objects in `this.eligibilityData`,
   * but subclasses may override for custom logic
   */
  protected get requirementsByStatus(): RequirementsByStatus<OppType> {
    const met = { ...this.eligibilityData.eligibleCriteria };
    const notMet = { ...this.eligibilityData.ineligibleCriteria };

    return { met, notMet };
  }

  get requirements(): EligibilityReport["requirements"] {
    const sections: Array<RequirementsSectionContent> = [];

    const { trackedCriteria } = this.config.requirements.summary;
    const orderedCriteria = Object.keys(trackedCriteria);

    // run a separate formatting pipeline for each grouping
    // since they are processed a little differently
    const { met, notMet } = this.requirementsByStatus;

    if (Object.keys(met).length) {
      sections.push({
        label: "Requirements you **have** met",
        icon: "Success",
        requirements: orderedCriteria
          .filter((key) => key in met)
          .map((key) => ({
            // ineligible reason is excluded, since these criteria are met
            criterion: cleanupInlineTemplate(
              hydrateTemplate(trackedCriteria[key].criterion, {
                currentCriterion: met[key],
              }),
            ),
          })),
      });
    }

    if (Object.keys(notMet).length) {
      sections.push({
        label: "Requirements you **have not** met yet",
        icon: "CloseOutlined",
        requirements: orderedCriteria
          .filter((key) => key in notMet)
          .map((key) =>
            // here, by mapping over both values in the copy object,
            // we are including criterion and ineligible reason, when it is present
            mapValues(trackedCriteria[key], (template) =>
              template
                ? cleanupInlineTemplate(
                    hydrateTemplate(template, {
                      currentCriterion: notMet[key],
                    }),
                  )
                : "",
            ),
          ),
      });
    }

    if (this.config.requirements.summary.untrackedCriteria.length) {
      sections.push({
        label: "Ask your case manager if you’ve met these requirements",
        icon: "ArrowCircled",
        requirements: this.config.requirements.summary.untrackedCriteria,
      });
    }

    return sections;
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
