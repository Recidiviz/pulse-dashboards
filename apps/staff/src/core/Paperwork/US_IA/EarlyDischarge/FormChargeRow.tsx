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
import { rem, rgba } from "polished";
import styled from "styled-components";

import { UsIaEarlyDischargeCharge } from "~datatypes";
import { Checkbox, palette, useCheckboxGroupContext } from "~design-system";

import {
  DetailsBox,
  SecureDetailsContent,
  SecureSmallDetailsCopy,
} from "../../../WorkflowsJusticeInvolvedPersonProfile/styles";
import { chargeMetaLine } from "./utils";

const Row = styled(DetailsBox).attrs({ className: "fs-exclude" })<{
  $selected: boolean;
}>`
  padding: 0;
  border-color: ${({ $selected }) =>
    $selected ? palette.pine4 : palette.slate20};
  background-color: ${({ $selected }) =>
    $selected ? rgba(palette.signal.highlight, 0.06) : palette.white};
`;

const RowCheckbox = styled(Checkbox)`
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: ${rem(spacing.md)} 12px;

  .ds-checkbox__box {
    margin-top: ${rem(2)};
  }

  .ds-checkbox__label {
    /* Bootstrap's reboot gives every label a bottom margin. */
    margin-bottom: 0;
    flex: 1;
    display: flex;
    justify-content: space-between;
    gap: ${rem(spacing.md)};

    /* Stretches the label's click target over the whole row, including its
       padding and the gap beside the checkbox. */
    &::after {
      content: "";
      position: absolute;
      inset: 0;
    }
  }
`;

const ChargeMeta = styled(SecureSmallDetailsCopy)`
  flex: none;
  color: ${palette.slate60};
`;

type FormChargeRowProps = {
  charge: UsIaEarlyDischargeCharge;
};

// TODO(IA-397): add a locked variant for charges already submitted.
export function FormChargeRow({ charge }: FormChargeRowProps) {
  const { value: selectedIds } = useCheckboxGroupContext();

  return (
    <Row $selected={selectedIds.includes(charge.chargeExternalId)}>
      <RowCheckbox value={charge.chargeExternalId}>
        <SecureDetailsContent as="span">
          {charge.description}
        </SecureDetailsContent>
        <ChargeMeta as="span">{chargeMetaLine(charge)}</ChargeMeta>
      </RowCheckbox>
    </Row>
  );
}
