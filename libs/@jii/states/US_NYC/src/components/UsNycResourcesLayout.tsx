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

import { Outlet } from "react-router-dom";

import { ScreenFillingWrapper, useHeaderOverride } from "~@jii/layout";

import { US_NYC_CONTENT } from "../content";
import { BackTargetProvider } from "./BackTargetContext/BackTargetContext";
import { CRENavBar } from "./CRENavBar/CRENavBar";
import { Footer } from "./Footer/Footer";
import { QueryBoundary } from "./QueryBoundary";

export function UsNycResourcesLayout() {
  useHeaderOverride();

  return (
    <BackTargetProvider>
      {/* Kept outside of the QueryBoundary so a page-level suspend (e.g. navigating to
       * a resource whose detail data hasn't loaded yet) can't unmount it and corrupt the
       * search overlay's modal state mid-open or mid-close. */}
      <CRENavBar />
      <QueryBoundary>
        <ScreenFillingWrapper
          top={<Outlet />}
          bottom={<Footer content={US_NYC_CONTENT.cre.footer} />}
        />
      </QueryBoundary>
    </BackTargetProvider>
  );
}
