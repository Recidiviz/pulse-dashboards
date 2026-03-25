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

import { Card, CopyWrapper, GoButton } from "~@jii/common-ui";
import { useSingleResidentContext } from "~@jii/data";
import { State } from "~@jii/paths";
import { useUsNcTranslations } from "~@jii/translation";
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
  const { t } = useUsNcTranslations();
  const { heading, nameLabel, idLabel, description, button } = t(
    ($) => $.rna.confirmIdentity,
    { returnObjects: true },
  );

  return (
    <Card>
      <RNAHeading>{heading}</RNAHeading>

      <RNADescription>
        <IdentityPart
          label={nameLabel}
          value={`${resident.personName.givenNames} ${resident.personName.surname}`}
        />
        <IdentityPart label={idLabel} value={resident.displayId} />
        <CopyWrapper>{description}</CopyWrapper>
      </RNADescription>

      <GoButton
        to={
          "../" +
          State.Resident.UsNcRNA.$.FormPage.buildRelativePath({
            pageNum: 1,
          })
        }
      >
        {button}
      </GoButton>
    </Card>
  );
}
