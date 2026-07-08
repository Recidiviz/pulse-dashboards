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

import { format } from "date-fns";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { UsMoClientMetadata } from "~datatypes";
import { palette, typography } from "~design-system";

import { ModuleEmptyState } from "../shared/styles";
import { getObjectiveDueStatus } from "./caseplanUtils";

// --- Case plan goal sections ----------------------------------------------

const GoalHeaderSection = styled.section`
  align-items: baseline;
  background: ${palette.slate10};
  display: flex;
  gap: ${rem(16)};
  justify-content: space-between;
  padding: ${rem(12)} ${rem(16)};
`;

const GoalTitle = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans14}
  color: ${palette.pine1};
  font-weight: 600;
  min-width: 0;
`;

const GoalLabel = styled.div`
  ${typography.Sans12}
  color: ${palette.slate60};
  flex-shrink: 0;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const GoalBodySection = styled.section`
  background: ${palette.white};
  display: flex;
  flex-direction: column;
  gap: ${rem(16)};
  padding: ${rem(12)} ${rem(16)};
`;

const Objective = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(4)};
`;

/** Objective's first line: text on the left, due-status label on the right. */
const ObjectiveRow = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${rem(16)};
  justify-content: space-between;
`;

const ObjectiveText = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans12}
  color: ${palette.slate85};
  min-width: 0;
`;

const ObjectiveDueDate = styled.div`
  ${typography.Sans12}
  color: ${palette.slate60};
`;

const ObjectiveStatus = styled.div<{ $status: "overdue" | "dueSoon" }>`
  ${typography.Sans12}
  color: ${({ $status }) =>
    $status === "overdue" ? palette.signal.error : palette.pine4};
  flex-shrink: 0;
  font-weight: 600;
`;

const TechniqueText = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans12}
  color: ${palette.slate60};
  padding-left: ${rem(12)};
`;

type CasePlanListProps = {
  casePlan: UsMoClientMetadata["casePlan"];
  now?: Date;
};

const STATUS_LABEL: Record<"overdue" | "dueSoon", string> = {
  overdue: "Overdue",
  dueSoon: "Due Soon",
};

/**
 * Renders a US_MO client's case plan as a sequence of `<section>`s — for each
 * goal, a shaded header section (goal text + an uppercase "GOAL" label) followed,
 * when the goal has objectives, by a body section listing each objective with
 * its own due date + Overdue/Due Soon status and its techniques. The due date
 * lives on the objective (per the metadata schema), not the goal. The sections
 * are siblings so the enclosing `CardFrame` draws the dividers between them;
 * this component owns no card border of its own.
 */
export const CasePlanList: React.FC<CasePlanListProps> = ({
  casePlan,
  now = new Date(),
}) => {
  if (!casePlan || casePlan.length === 0) {
    return <ModuleEmptyState>No case plan on file</ModuleEmptyState>;
  }

  return (
    <>
      {casePlan.map((goal, goalIndex) => (
        // Goals have no stable id in the metadata; index is the only key.
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={goalIndex}>
          <GoalHeaderSection>
            <GoalTitle>{goal.goal ?? "—"}</GoalTitle>
            <GoalLabel>Goal</GoalLabel>
          </GoalHeaderSection>
          {goal.objectivesAndTechniques.length > 0 && (
            <GoalBodySection>
              {goal.objectivesAndTechniques.map((objective, objectiveIndex) => {
                const status = getObjectiveDueStatus(
                  objective.objectiveEndDate,
                  now,
                );
                return (
                  // Objectives/techniques have no stable id; index is the key.
                  // eslint-disable-next-line react/no-array-index-key
                  <Objective key={objectiveIndex}>
                    <ObjectiveRow>
                      <ObjectiveText>
                        {objective.objective ?? "—"}
                      </ObjectiveText>
                      {status && (
                        <ObjectiveStatus $status={status}>
                          {STATUS_LABEL[status]}
                        </ObjectiveStatus>
                      )}
                    </ObjectiveRow>
                    {objective.objectiveEndDate && (
                      <ObjectiveDueDate>
                        Due {format(objective.objectiveEndDate, "MMM d, yyyy")}
                      </ObjectiveDueDate>
                    )}
                    {objective.techniques.map((technique, techniqueIndex) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <TechniqueText key={techniqueIndex}>
                        {technique}
                      </TechniqueText>
                    ))}
                  </Objective>
                );
              })}
            </GoalBodySection>
          )}
        </React.Fragment>
      ))}
    </>
  );
};
