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

import { Sans16, Sans18 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { OpportunityType } from "~datatypes";
import { Button, palette, spacing } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { Resident } from "../../WorkflowsStore/Resident";

const SelectFormWrapper = styled.div`
  border-top: 1px solid ${palette.slate10};
  margin: 0 -1rem;
  padding: 1rem;
`;

const Header = styled(Sans18)`
  color: ${palette.pine1};
`;

const Subheader = styled(Sans18)`
  padding: 0.5rem 0;
`;

const FormLinkButton = styled(Button).attrs({
  shape: "block",
})`
  margin: ${rem(spacing.md)} 0;
  padding: ${rem(spacing.md)};
  width: 100%;
  background: ${palette.marble1};
  border: ${palette.slate} 1px solid;
  color: ${palette.pine1};
  justify-content: left;
  text-align: left;
  line-height: 130%;

  &:hover {
    background: ${palette.marble1};
  }
`;

const FORMS_TO_LIST: OpportunityType[] = [
  "usTnInitialClassification2026Policy",
  "usTnAnnualReclassification2026Policy",
  "usTnCustodyLevelDowngrade2026Policy",
  "usTnSpecialCustodyLevelUpgrade2026Policy",
];

export const SelectFormContents = observer(function SelectFormContents({
  selectedResident: { pseudonymizedId },
}: {
  selectedResident: Resident;
}) {
  const {
    workflowsStore: { opportunityConfigurationStore },
  } = useRootStore();

  return (
    <SelectFormWrapper>
      <Header>Select Classification Type</Header>
      <Subheader>
        Please select the type of classification for this Resident
      </Subheader>
      {FORMS_TO_LIST.map((type) => {
        if (
          opportunityConfigurationStore.enabledOpportunityTypes.indexOf(
            type,
          ) === -1
        )
          return null;
        const config = opportunityConfigurationStore.opportunities[type];

        return (
          <Link
            to={`/workflows/${config.urlSection}/${pseudonymizedId}/${pseudonymizedId}`}
          >
            <FormLinkButton>
              <Sans16>{config.label}</Sans16>
            </FormLinkButton>
          </Link>
        );
      })}
    </SelectFormWrapper>
  );
});
