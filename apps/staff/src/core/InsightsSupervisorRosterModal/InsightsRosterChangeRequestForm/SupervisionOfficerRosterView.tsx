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

import pluralize from "pluralize";

import { PersonInitialsAvatar } from "~ui";

import IneligibleIcon from "../../../assets/static/images/ineligibleIcon.svg";
import { InsightsTooltip } from "../../InsightsPageLayout/InsightsPageLayout";
import { insightsUrl } from "../../views";
import {
  InitialRosterViewWrapper,
  OfficerGroupListItemDisplayName,
  OfficerItemLink,
  OfficerListGroup,
  OfficerListSectionHeader,
  OfficerRemoveLinkButton,
  ScrollboxOverlay,
} from "../styles";
import { InsightsRosterChangeRequestFormManager } from "../types";

type SupervisionOfficerRosterProps = {
  manager: InsightsRosterChangeRequestFormManager;
};

/**
 * Renders a roster view for supervision officers.
 *
 * This component displays a list of officers with their avatars and names. When an officer is hovered,
 * a remove button appears, allowing the user to **ADD** the officer from the affected officers list, and
 * changing the roster request type to `REMOVE`.
 * It integrates with a form instance to track the change type and update the list of officers.
 */
export const SupervisionOfficerRosterView = ({
  manager,
}: SupervisionOfficerRosterProps) => {
  const [form, { officersOnSupervisorTeam, staffLabel, supervisorInfo }] =
    manager;
  // Form copy
  const sectionHeader = "Your current team";
  const tooltipContentForExcludedOfficers =
    "This officer is not included in outcomes because of their specialized caseload.";
  const linkButtonText = "Remove";

  return (
    <InitialRosterViewWrapper>
      <OfficerListSectionHeader>{sectionHeader}</OfficerListSectionHeader>
      <ScrollboxOverlay>
        <form.Field name="affectedOfficers" mode="array">
          {(field) => (
            <OfficerListGroup>
              {officersOnSupervisorTeam &&
                officersOnSupervisorTeam.map((officer) => (
                  <OfficerListGroup.Item key={officer.externalId}>
                    <OfficerItemLink
                      to={insightsUrl("supervisionStaff", {
                        officerPseudoId: officer.pseudonymizedId,
                      })}
                      aria-label={`View supervision staff details for ${officer.displayName}`}
                    >
                      <PersonInitialsAvatar
                        name={officer.displayName}
                        size={20}
                      />
                      <OfficerGroupListItemDisplayName>
                        {officer.displayName}
                      </OfficerGroupListItemDisplayName>
                      {!officer.includeInOutcomes && (
                        <InsightsTooltip
                          maxWidth={354}
                          contents={tooltipContentForExcludedOfficers}
                        >
                          <img
                            src={IneligibleIcon}
                            alt="This is an excluded officer"
                          />
                        </InsightsTooltip>
                      )}
                      <OfficerRemoveLinkButton
                        name={officer.displayName}
                        key={officer.externalId}
                        variant={"link"}
                        size={"sm"}
                        aria-label={`Add ${officer.displayName} to the list of ${pluralize(staffLabel)} to remove from ${supervisorInfo?.displayName}'s team.`}
                        role={"option"}
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          e.preventDefault();
                          form.setFieldValue("requestChangeType", "REMOVE");
                          field.pushValue(officer);
                        }}
                      >
                        {linkButtonText}
                      </OfficerRemoveLinkButton>
                    </OfficerItemLink>
                  </OfficerListGroup.Item>
                ))}
            </OfficerListGroup>
          )}
        </form.Field>
      </ScrollboxOverlay>
    </InitialRosterViewWrapper>
  );
};
