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

import { CardFrame, ModuleEmptyState } from "../shared/styles";
import {
  compareObjectivesByStatus,
  getObjectiveDueStatus,
  ObjectiveDueStatus,
} from "./caseplanUtils";

const STATUS_DISPLAY: Record<
  ObjectiveDueStatus,
  { label: string; color: string }
> = {
  overdue: { label: "Overdue", color: palette.signal.error },
  dueSoon: { label: "Due Soon", color: palette.slate85 },
  due: { label: "Due", color: palette.slate85 },
  completed: { label: "Completed", color: palette.slate85 },
};

// --- Case plan goal sections ----------------------------------------------

const GoalHeaderSection = styled.section`
  align-items: baseline;
  display: flex;
  gap: ${rem(16)};
  justify-content: space-between;
  padding: ${rem(12)} ${rem(16)};
`;

const GoalTitle = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans14}
  color: ${palette.slate85};
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
`;

const CasePlanContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(20)};
`;

const Objective = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(4)};
  color: ${palette.slate85};
  &:hover {
    background: ${palette.marble2};
  }
  padding: ${rem(12)} ${rem(16)};
`;

const ObjectiveRow = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${rem(16)};
  justify-content: space-between;
`;

const ObjectiveColumn = styled.div`
  align-items: baseline;
  display: flex;
  flex-direction: column;
  gap: ${rem(4)};
`;

const ObjectiveColumnRight = styled(ObjectiveColumn)`
  align-items: flex-end;
  text-align: right;
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

const ObjectiveWasDueDate = styled.div`
  ${typography.Sans12}
  color: ${palette.slate85};
`;

const ObjectiveStatus = styled.div<{
  $status: ObjectiveDueStatus;
}>`
  ${typography.Sans12}
  color: ${({ $status }) => STATUS_DISPLAY[$status].color};
  flex-shrink: 0;
  font-weight: 600;
`;

const TechniqueText = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans12}
  color: ${palette.pine2};
`;

type CasePlanListProps = {
  casePlan: UsMoClientMetadata["casePlan"];
  now?: Date;
};

/**
 * Renders a US_MO client's case plan as a sequence of goal cards — for each
 * goal, its own `CardFrame` containing a header section (goal text + an
 * uppercase "GOAL" label) followed, when the goal has objectives, by a body
 * section listing each objective with its own status (Overdue/Due
 * Soon/Due/Completed), due or completion date, and techniques. Objectives
 * within a goal are sorted Overdue → Due Soon → Due → (no date) → Completed;
 * goal-level order is unaffected. The dates live on the objective (per the
 * metadata schema), not the goal.
 */
export const CasePlanList: React.FC<CasePlanListProps> = ({
  casePlan,
  now = new Date(),
}) => {
  if (!casePlan || casePlan.length === 0) {
    return <ModuleEmptyState>No case plan on file</ModuleEmptyState>;
  }

  return (
    <CasePlanContainer>
      {casePlan.map((goal, goalIndex) => (
        // Goals have no stable id in the metadata; index is the only key.
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={goalIndex}>
          <CardFrame>
            <GoalHeaderSection>
              <GoalTitle>{goal.goal ?? "—"}</GoalTitle>
              <GoalLabel>Goal</GoalLabel>
            </GoalHeaderSection>
            {goal.objectivesAndTechniques.length > 0 && (
              <GoalBodySection>
                {goal.objectivesAndTechniques
                  // Capture each objective's original (pre-sort) index so the
                  // React key stays tied to the same logical objective even
                  // as sorting reorders the list across renders (e.g. when a
                  // status crosses a day/threshold boundary) — keying on the
                  // post-sort position would let React reconcile a DOM node
                  // against a different objective.
                  .map((objective, originalIndex) => ({
                    objective,
                    originalIndex,
                  }))
                  .sort((a, b) =>
                    compareObjectivesByStatus(a.objective, b.objective, now),
                  )
                  .map(({ objective, originalIndex }) => {
                    const status = getObjectiveDueStatus(
                      objective.objectiveEndDate,
                      objective.objectivePlannedEndDate,
                      now,
                    );
                    return (
                      // originalIndex is stable across re-sorts (captured before
                      // the .sort() above), so it's safe as a React key even
                      // though objectives have no id of their own.
                      <Objective key={originalIndex}>
                        <ObjectiveRow>
                          <ObjectiveColumn>
                            <ObjectiveText>
                              {objective.objective ?? "—"}
                            </ObjectiveText>
                            {objective.techniques.map(
                              (technique, techniqueIndex) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <TechniqueText key={techniqueIndex}>
                                  {technique}
                                </TechniqueText>
                              ),
                            )}
                          </ObjectiveColumn>
                          <ObjectiveColumnRight>
                            {status && (
                              <ObjectiveStatus $status={status}>
                                {STATUS_DISPLAY[status].label}
                              </ObjectiveStatus>
                            )}
                            {status === "completed" ? (
                              <>
                                {objective.objectiveEndDate && (
                                  <ObjectiveDueDate>
                                    {format(
                                      objective.objectiveEndDate,
                                      "MMM d, yyyy",
                                    )}
                                  </ObjectiveDueDate>
                                )}
                                {objective.objectivePlannedEndDate && (
                                  <ObjectiveWasDueDate>
                                    Was due{" "}
                                    {format(
                                      objective.objectivePlannedEndDate,
                                      "MMM d, yyyy",
                                    )}
                                  </ObjectiveWasDueDate>
                                )}
                              </>
                            ) : (
                              <ObjectiveDueDate>
                                {objective.objectivePlannedEndDate
                                  ? format(
                                      objective.objectivePlannedEndDate,
                                      "MMM d, yyyy",
                                    )
                                  : "—"}
                              </ObjectiveDueDate>
                            )}
                          </ObjectiveColumnRight>
                        </ObjectiveRow>
                      </Objective>
                    );
                  })}
              </GoalBodySection>
            )}
          </CardFrame>
        </React.Fragment>
      ))}
    </CasePlanContainer>
  );
};
