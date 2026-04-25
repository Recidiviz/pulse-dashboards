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

import { FC } from "react";
import styled from "styled-components";

import { CardValue } from "~@jii/common-ui";
import { palette } from "~design-system";

import { dateCardModifierClassesEnum } from "../SentenceDates/DatePresenter";
import { DefaultProps } from "./types";

export type DateValueProps = DefaultProps;

const ValueWrapper = styled(CardValue)`
  .${dateCardModifierClassesEnum.enum["DateCard--is-upcoming"]} & {
    color: ${palette.signal.notification};
  }

  .${dateCardModifierClassesEnum.enum["DateCard--is-past"]} & {
    color: ${palette.slate60};
  }
`;

export const DateValue: FC<DateValueProps> = (props) => {
  return <ValueWrapper {...props} />;
};
