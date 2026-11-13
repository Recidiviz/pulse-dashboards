// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { ParoleBoardReportMode } from "../../../../ParoleStore/presenters/ParoleBoardReportPresenter";
import {
  CommunityReentryPlanFields,
  ResolvedCommunityReentryPlan,
} from "../../../../ParoleStore/report/communityReentryPlan";
import {
  ParoleSectionCard,
  ParoleSectionTitle,
} from "../ParoleCaseProfileStyles";
import { ReportTextBox, ReportTextBoxes } from "./report/ReportTextBoxes";

type Field = keyof CommunityReentryPlanFields;

// The data sheet's labels and character limits, in the order the design shows
// the boxes.
export const COMMUNITY_REENTRY_PLAN_BOXES: ReadonlyArray<ReportTextBox<Field>> =
  [
    { field: "housing", label: "Housing", maxLength: 1500 },
    { field: "employment", label: "Employment", maxLength: 1500 },
    {
      field: "aftercare",
      label: "Aftercare / treatment plan",
      maxLength: 1500,
    },
    { field: "transportation", label: "Transportation", maxLength: 1000 },
    { field: "supportNetwork", label: "Support network", maxLength: 1000 },
  ];

/**
 * US_ID's Community Reentry Plan card: the PHI's notes on the resident's plan
 * for release, in one box each for housing, employment, aftercare or
 * treatment, transportation, and the support network. Each box saves as the
 * PHI types.
 *
 * @param mode - EDIT or READ. The report presenter picks it.
 * @param plan - The resolved Community Reentry Plan section.
 * @param onSave - Saves one box's text, or null when the PHI emptied it.
 */
export function UsIdCommunityReentryPlanSection({
  mode,
  plan,
  onSave,
}: {
  mode: ParoleBoardReportMode;
  plan: ResolvedCommunityReentryPlan;
  onSave: (field: Field, value: string | null) => Promise<void>;
}) {
  return (
    <ParoleSectionCard>
      <ParoleSectionTitle>Community Reentry Plan</ParoleSectionTitle>
      <ReportTextBoxes
        mode={mode}
        boxes={COMMUNITY_REENTRY_PLAN_BOXES}
        values={mapValues(plan.fields, (field) => field.value)}
        onSave={onSave}
      />
    </ParoleSectionCard>
  );
}
