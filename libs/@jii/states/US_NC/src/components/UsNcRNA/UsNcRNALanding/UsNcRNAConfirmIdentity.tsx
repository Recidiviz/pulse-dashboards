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

import { rem } from "polished";
import styled from "styled-components";

import { Card, GoButton } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { palette, spacing } from "~design-system";

import { RNADescription, RNAHeading } from "../styles";

const EmphasizedSpan = styled.span`
  color: ${palette.pine1};
  margin-right: ${rem(spacing.md)};
`;

function IdentityPart({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span>{label}: </span>
      <EmphasizedSpan>{value}</EmphasizedSpan>
    </>
  );
}

export function UsNcRNAConfirmIdentity() {
  const { resident } = useSingleResidentContext();

  return (
    <Card>
      <RNAHeading>Is this you?</RNAHeading>
      <RNADescription>
        <IdentityPart
          label="Name"
          value={`${resident.personName.givenNames} ${resident.personName.surname}`}
        />
        <IdentityPart label="ID Number" value={resident.displayId} />
        <p>If this is not you, please talk to a staff member.</p>
        <p>
          If this is you, please tap the button to continue to your Self-Report.
        </p>
      </RNADescription>
      <GoButton
        to={
          "../" +
          State.Resident.UsNcRNA.$.FormPage.buildRelativePath({
            pageNum: 1,
          })
        }
      >
        Yes, this is me
      </GoButton>
    </Card>
  );
}
