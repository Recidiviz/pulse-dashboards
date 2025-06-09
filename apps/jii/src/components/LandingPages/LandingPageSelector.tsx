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

import { Button, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useId } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { Selector, SelectorProps } from "../Selector/Selector";

const Wrapper = styled.div`
  background: ${palette.marble2};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(14)};
  margin: ${rem(spacing.xl)} 0;
  padding: ${rem(spacing.xl)};

  label {
    display: block;
    margin-bottom: ${rem(spacing.md)};
  }
`;

const SelectWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
  justify: space-between;

  & > div {
    flex 4 0 55%;
  }

  & > button {
    flex: 1 1 auto;
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
    <Wrapper>
      <label id={labelId}>{label}</label>
      <SelectWrapper>
        <Selector {...{ placeholder, options, onChange }} labelId={labelId} />
        <Button disabled={disableButton} onClick={onButtonClick}>
          Go
        </Button>
      </SelectWrapper>
    </Wrapper>
  );
});
