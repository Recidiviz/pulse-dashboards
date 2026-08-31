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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import {
  ParoleCommunitySupervisionPlanEntry,
  ParoleRecommendedStatus,
} from "~datatypes";
import { palette } from "~design-system";

import { PaletteKey, WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import { SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  EmptyState,
  FactLabel,
  FactStack,
  SectionCard,
  SectionStack,
} from "./shared";

const RECOMMENDED_STATUS_COLORS: Record<ParoleRecommendedStatus, PaletteKey> = {
  "YES (Favorable)": "GREEN",
  "NO (Unfavorable)": "RED",
  Pending: "YELLOW",
  TBD: "SLATE",
  Withdrawn: "SLATE_DARK",
};

const PlanCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  background: ${palette.marble2};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(6)};
  padding: ${rem(spacing.md)};
`;

const PlanCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
`;

const PlanTypeTitle = styled.div`
  font-weight: 600;
  color: ${palette.pine1};
`;

const PlanDetailsRow = styled.div`
  display: flex;
  gap: ${rem(spacing.lg)};
`;

function RecommendedBadge({ status }: { status: ParoleRecommendedStatus }) {
  return (
    <WorkflowsBadgePill
      text={status}
      palette={RECOMMENDED_STATUS_COLORS[status]}
    />
  );
}

function CommunitySupervisionPlanCard({
  entry,
}: {
  entry: ParoleCommunitySupervisionPlanEntry;
}) {
  return (
    <PlanCard>
      <PlanCardHeader>
        <FactStack>
          <FactLabel>TYPE OF PLAN</FactLabel>
          <PlanTypeTitle>{entry.typeOfPlan}</PlanTypeTitle>
        </FactStack>
        <RecommendedBadge status={entry.recommended} />
      </PlanCardHeader>
      <PlanDetailsRow>
        <FactStack>
          <FactLabel>NAME (RELATIONSHIP)</FactLabel>
          <div>
            {entry.name} ({entry.relationship})
          </div>
        </FactStack>
        <FactStack>
          <FactLabel>ADDRESS</FactLabel>
          <div>{entry.address}</div>
        </FactStack>
      </PlanDetailsRow>
    </PlanCard>
  );
}

export function CommunitySupervisionPlanSection({
  communitySupervisionPlan,
}: {
  communitySupervisionPlan: Array<ParoleCommunitySupervisionPlanEntry>;
}) {
  return (
    <SectionCard>
      <SectionCardHeader>Community Supervision Plan</SectionCardHeader>
      <PaddedSectionCardBody>
        {communitySupervisionPlan.length === 0 ? (
          <EmptyState>No community supervision plan on file.</EmptyState>
        ) : (
          <SectionStack>
            {communitySupervisionPlan.map((entry, idx) => (
              <CommunitySupervisionPlanCard
                // eslint-disable-next-line react/no-array-index-key
                key={`${entry.typeOfPlan}-${entry.name}-${entry.relationship}-${entry.address}-${entry.recommended}-${idx}`}
                entry={entry}
              />
            ))}
          </SectionStack>
        )}
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
