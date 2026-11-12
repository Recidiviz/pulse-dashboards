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

import styled from "styled-components";

import { AdminPageSkeleton, MonthSectionSkeleton } from "./AdminPageSkeleton";

// A page fills the viewport, so the frame gives the skeleton its height.
const FullHeight = styled.div`
  height: 100vh;

  & > * {
    height: 100%;
  }
`;

// The section fills the page below the header, so the frame stands in for
// the page around it.
const SectionFrame = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

export default {};

// The layout follows the Public Calendar screen in the Calendar Unit
// Dashboard design; colours, type and spacing follow ~design-system.

/** The host app's fallback while the admin tool's code loads: five weeks. */
export const Page = () => (
  <FullHeight>
    <AdminPageSkeleton />
  </FullHeight>
);
Page.parameters = { layout: "fullscreen" };

/** A first load of August 2026, which spans six weeks. */
export const PageForMonth = () => (
  <FullHeight>
    <AdminPageSkeleton month={{ year: 2026, month: 8 }} />
  </FullHeight>
);
PageForMonth.parameters = { layout: "fullscreen" };

/**
 * What shows below the header while a month that isn't cached loads, here
 * February 2026, which spans four weeks.
 */
export const MonthSection = () => (
  <SectionFrame>
    <MonthSectionSkeleton month={{ year: 2026, month: 2 }} />
  </SectionFrame>
);
MonthSection.parameters = { layout: "fullscreen" };
