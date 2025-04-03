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

import { Loading } from "@recidiviz/design-system";
import { useStore } from "@tanstack/react-form";
import { plural } from "pluralize";

import { SupervisionSupervisorRosterModalPresenter } from "../../../InsightsStore/presenters/SupervisionSupervisorRosterModalPresenter";
import { RosterRequestViewContainer } from "../styles";
import { SelectOptionWithLocation } from "../types";
import { useRosterChangeRequestForm } from "../utils/useRosterChangeRequestForm";
import { RosterChangeRequestSubmissionView } from "./RosterChangeRequestSubmissionView";
import { SupervisionOfficerRosterView } from "./SupervisionOfficerRosterView";
import { SupervisionOfficerSelect } from "./SupervisionOfficerSelect/SupervisionOfficerSelect";

export type InsightsRosterChangeRequestFormProps = {
  presenter: SupervisionSupervisorRosterModalPresenter;
};

/**
 * Renders the Insights Roster Change Request Form.
 *
 * References
 * - MilestonesSidePanel
 */
export const InsightsRosterChangeRequestForm = ({
  presenter,
}: InsightsRosterChangeRequestFormProps) => {
  const manager = useRosterChangeRequestForm(presenter);

  const [
    form,
    {
      transformOptionsIntoOfficers,
      staffLabel,
      selectableOfficersAsSelectOptions,
      selectedOfficersAsSelectOptions,
    },
  ] = manager;

  const requestChangeType = useStore(
    form.store,
    (s) => s.values.requestChangeType,
  );

  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);
  /**
   * Generate placeholder text for the dropdown based on the staff label and request change type.
   */
  const dropdownPlaceholderText = `Type ${plural(staffLabel)} to ${requestChangeType.toLowerCase()}`;

  return (
    <form
      style={{
        height: "100%",
        width: "100%",
        display: isSubmitting ? "flex" : "block",
        ...(isSubmitting
          ? {
              alignItems: "center",
              justifyContent: "center",
            }
          : {}),
      }}
    >
      {isSubmitting ? (
        <Loading message="Forwarding Request..." />
      ) : (
        <RosterRequestViewContainer>
          <form.Field name="affectedOfficers" mode="array">
            {(field) => (
              <SupervisionOfficerSelect
                onChange={(newValue) => {
                  field.setValue(
                    transformOptionsIntoOfficers(
                      newValue as SelectOptionWithLocation[],
                    ),
                  );
                }}
                setRequestChangeType={(value) =>
                  field.form.setFieldValue("requestChangeType", value)
                }
                // Map the currently selected officers into the select options format
                value={selectedOfficersAsSelectOptions}
                // Provide the list of available officers
                options={selectableOfficersAsSelectOptions}
                staffLabel={staffLabel}
                dropdownPlaceholderText={dropdownPlaceholderText}
                requestChangeType={requestChangeType}
              />
            )}
          </form.Field>
          {/* Conditionally render the view based on the current state */}
          {presenter.view === "ROSTER" && (
            <SupervisionOfficerRosterView manager={manager} />
          )}
          {presenter.view === "FORM" && (
            <RosterChangeRequestSubmissionView manager={manager} />
          )}
        </RosterRequestViewContainer>
      )}
    </form>
  );
};
