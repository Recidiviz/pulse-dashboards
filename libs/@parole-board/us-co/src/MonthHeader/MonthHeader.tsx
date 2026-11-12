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

import { ReactNode, Ref } from "react";

import { Heading } from "~@parole-board/common";

import {
  Actions,
  Divider,
  Eyebrow,
  Frame,
  Main,
  TitleRow,
  TopRow,
} from "./MonthHeader.styles";

export type MonthHeaderProps = {
  /** The month's title, such as "September 2026". */
  title: string;
  /**
   * The controls after the eyebrow, such as MonthNav with the month arrows
   * and picker, and "+ Add month".
   */
  navigation?: ReactNode;
  /** Buttons on the right, such as "Add hearing" and "Review & Publish". */
  actions?: ReactNode;
  /**
   * The month's title. It can take focus from script only, so focus has
   * somewhere to go when the control that had it goes away, as after a delete.
   */
  titleRef?: Ref<HTMLHeadingElement>;
};

/**
 * The top of the Public Calendar screen: the eyebrow, the navigation, the
 * month's title, and the page's actions on the right. It lays out what it's
 * given and decides nothing itself. It follows the layout of the Public
 * Calendar screen in the Calendar Unit Dashboard design, with ~design-system
 * type. As in the design, the month's status shows only in the banners below
 * it.
 */
export function MonthHeader({
  title,
  navigation,
  actions,
  titleRef,
}: MonthHeaderProps) {
  return (
    <Frame>
      <Main>
        <TopRow>
          <Eyebrow>Public Calendar</Eyebrow>
          <Divider aria-hidden />
          {navigation}
        </TopRow>
        <TitleRow>
          <Heading as="h1" ref={titleRef} tabIndex={-1}>
            {title}
          </Heading>
        </TitleRow>
      </Main>
      {actions && <Actions>{actions}</Actions>}
    </Frame>
  );
}
