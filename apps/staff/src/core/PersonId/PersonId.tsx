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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useClipboard from "react-use-clipboard";
import styled from "styled-components/macro";

import copyIcon from "../../assets/static/images/copy.svg";
import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore/Opportunity";

export const PersonIdWithCopyIcon = styled.span<{ shiftIcon: boolean }>`
  color: ${palette.data.teal1};
  padding: 0 ${rem(spacing.xs)};
  border-radius: ${rem(spacing.xs / 2)};
  transition: all 0.3s ease;
  white-space: nowrap;

  &::after {
    content: url("${copyIcon}");
    margin-left: ${rem(spacing.sm)};
    vertical-align: ${(props) => (props.shiftIcon ? "-15%" : "0")};
  }
  &:hover {
    background: rgba(53, 83, 98, 0.05);
    cursor: pointer;
  }
  &:active {
    background: ${palette.slate20};
    cursor: pointer;
  }
`;

const PersonId: React.FC<{
  children: React.ReactNode;
  personId: string;
  shiftIcon?: boolean;
  docLabel?: string;
  opportunity?: Opportunity;
  pseudoId?: string;
}> = ({
  children,
  personId,
  shiftIcon = false,
  docLabel = "DOC",
  opportunity = undefined,
  pseudoId = undefined,
}) => {
  const [isCopied, copyToClipboard] = useClipboard(personId, {
    successDuration: 5000,
  });

  const { currentTenantId, analyticsStore } = useRootStore();

  // TODO(#6737): Parameterize this and pull from same source as insights if possible
  const stateIdDescriptor =
    currentTenantId === "US_AZ" ? "ADC number" : `${docLabel} ID`;

  useEffect(() => {
    if (isCopied) toast(`${stateIdDescriptor} copied!`, { duration: 5000 });
  }, [isCopied, stateIdDescriptor]);

  return (
    <PersonIdWithCopyIcon
      title={`Copy ${stateIdDescriptor} to clipboard`}
      className="fs-exclude"
      onClick={(e) => {
        // if PersonId is in a clickable element, prevent other effects of the click,
        // such as opening a modal or following a link
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard();

        if (opportunity) {
          analyticsStore.trackPersonIdCopiedtoClipboard({
            justiceInvolvedPersonId: opportunity.person.pseudonymizedId,
            opportunityType: opportunity.type,
            opportunityId: opportunity.sentryTrackingId,
          });
        } else if (pseudoId) {
          analyticsStore.trackPersonIdCopiedtoClipboard({
            justiceInvolvedPersonId: pseudoId,
          });
        }
      }}
      shiftIcon={shiftIcon}
    >
      {children}
    </PersonIdWithCopyIcon>
  );
};

export default PersonId;
