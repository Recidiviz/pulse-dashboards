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

import type { ReactNode } from "react";

import useIsMobile from "~utils/react/useIsMobile";

import {
  Header,
  HeaderRow,
  Main,
  Page,
  Title,
} from "./PublicCalendarView.styles";

/** The page's one heading, as the public design brands it. */
export const PAGE_HEADING = "Parole Hearing Calendar";

/**
 * Whether the screen is a phone or a narrow tablet (768px wide or less), where
 * the month navigation sits under the title and the page's padding narrows.
 */
export function useIsPhone(): boolean {
  const { isTablet } = useIsMobile(true) as { isTablet: boolean };
  return isTablet;
}

/**
 * The public calendar's page: the header with its heading and, when there's
 * a month to move from, the month navigation, over the area that holds the
 * grid or a message. A banner goes between the two, across the page's full
 * width, as the admin's month status strip sits under its header. Every
 * state of the screen, the skeleton and the load error included, renders
 * inside it, so the header never jumps.
 */
export function PageFrame({
  phone,
  nav,
  banner,
  children,
}: {
  phone: boolean;
  nav?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Page>
      <Header $phone={phone}>
        <HeaderRow $phone={phone}>
          <Title>{PAGE_HEADING}</Title>
          {nav}
        </HeaderRow>
      </Header>
      {banner}
      <Main $phone={phone}>{children}</Main>
    </Page>
  );
}
