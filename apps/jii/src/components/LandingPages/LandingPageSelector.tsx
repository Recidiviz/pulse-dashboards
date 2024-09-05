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

import { Button, palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useId } from "react";
import styled from "styled-components/macro";

import { Selector, SelectorProps } from "../Selector/Selector";

const SelectorWrapper = styled.div`
  background: ${palette.marble2};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(14)};
  display: grid;
  gap: ${rem(spacing.md)};
  grid-template-areas:
    "label label"
    ". .";
  grid-template-rows: auto auto;
  grid-template-columns: 1fr auto;
  margin: ${rem(spacing.xl)} 0;
  padding: ${rem(spacing.xl)};

  label {
    grid-area: label;
  }
`;

type LandingPageSelectorProps<OptionVal> = Pick<
  SelectorProps<OptionVal>,
  "placeholder" | "onChange" | "options"
> & { label: string; disableButton: boolean; onButtonClick: () => void };

export const LandingPageSelector = observer(function LandingPageSelector<
  OptionVal,
>({
  label,
  placeholder,
  disableButton,
  onButtonClick,
  options,
  onChange,
}: LandingPageSelectorProps<OptionVal>) {
  const labelId = useId();

  return (
    <SelectorWrapper>
      <label id={labelId}>{label}</label>
      <Selector {...{ placeholder, options, onChange }} labelId={labelId} />
      <Button disabled={disableButton} onClick={onButtonClick}>
        Go
      </Button>
    </SelectorWrapper>
  );
});
