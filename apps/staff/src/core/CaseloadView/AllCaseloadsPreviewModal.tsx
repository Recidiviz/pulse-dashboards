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

import { Sans12, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { Incarceration } from "../WorkflowsJusticeInvolvedPersonProfile";
import { Heading } from "../WorkflowsJusticeInvolvedPersonProfile/Heading";
import { OpportunitiesAccordion } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunitiesAccordion";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";

const ItemHeader = styled(Sans12)`
  background-color: ${palette.marble2};
  border-bottom: 1px solid ${palette.slate10};
  border-top: 1px solid ${palette.slate10};
  color: ${palette.slate70};
  font-weight: 700;
  margin: 0 -${rem(spacing.md)};
  min-width: 100%;
  padding-top: ${rem(4)};
  padding-bottom: ${rem(4)};
  padding-left: ${rem(16)};
  text-transform: uppercase;
`;

export const AllCaseloadsPreviewModal = observer(
  function AllCaseloadsPreviewModal() {
    const {
      workflowsStore: { selectedResident },
    } = useRootStore();

    if (!selectedResident) return null;

    return (
      <WorkflowsPreviewModal
        isOpen={!!selectedResident}
        pageContent={
          <article>
            <Heading person={selectedResident} />
            <ItemHeader>Opportunities</ItemHeader>
            <OpportunitiesAccordion
              showIneligibleOpportunityTypes
              person={selectedResident}
            />
            <ItemHeader>Resident Details</ItemHeader>
            <Incarceration resident={selectedResident} />
          </article>
        }
      />
    );
  },
);
