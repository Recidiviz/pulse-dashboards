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

import { ReactNode } from "react";

import type { YearMonthOption } from "~@parole-board/common";
import { useHostLink, usePrefetchMonth } from "~@parole-board/common";
import { Button } from "~design-system";

import { toYearMonthParam } from "../model/month";
import { MonthLinkShape, Nav } from "./MonthHeader.styles";

/**
 * The header's month navigation, such as the month arrows either side of the
 * month picker. It lays out its children in a row, as a navigation landmark.
 */
export function MonthNav({ children }: { children: ReactNode }) {
  return <Nav aria-label="Months">{children}</Nav>;
}

/**
 * A link to another month, styled as the ~design-system borderless Button,
 * such as the month arrows. It renders the host's Link (useHostLink) with a
 * path relative to the month's route, "../2026-12", so it works wherever the
 * host mounts the admin tool, and the staff Link keeps the tenantId. It loads
 * the month into the cache as it renders, and again on hover and focus if
 * that copy has gone stale, so following it usually shows the month at once.
 * With no month, as past the last stored month, it's a disabled Button with
 * the same label, since a link needs somewhere to go.
 */
export function MonthLink({
  month,
  label,
  children,
}: {
  month: YearMonthOption | null;
  /** The accessible name, such as "Next month". */
  label: string;
  /** What shows, such as an arrow icon. */
  children: ReactNode;
}) {
  const HostLink = useHostLink();
  const prefetch = usePrefetchMonth(month);

  if (!month) {
    return (
      <Button kind="borderless" shape="block" aria-label={label} disabled>
        {children}
      </Button>
    );
  }
  return (
    <MonthLinkShape
      as={HostLink}
      to={`../${toYearMonthParam(month)}`}
      aria-label={label}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {children}
    </MonthLinkShape>
  );
}
