// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { Button } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { Opportunity } from "../../WorkflowsStore";

const StatusAwareButton = styled(Button).attrs({
  kind: "secondary",
  shape: "block",
})`
  max-width: 10rem;
`;

export const MenuButton = observer(function MenuButton({
  opportunity,
  onDenialButtonClick = () => null,
}: {
  opportunity: Opportunity;
  onDenialButtonClick?: () => void;
}) {
  const buttonText =
    opportunity.config.denialButtonText ??
    (opportunity.isAlert ? "Override?" : "Update eligibility");

  return (
    <StatusAwareButton onClick={onDenialButtonClick}>
      {buttonText}
    </StatusAwareButton>
  );
});
