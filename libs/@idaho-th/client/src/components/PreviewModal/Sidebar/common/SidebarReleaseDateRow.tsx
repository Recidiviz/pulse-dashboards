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

import type { ReleaseDateChangedAlert } from "~@idaho-th/client/interfaces/common";
import { formatCalendarDate } from "~@idaho-th/client/utils/date";

import CalendarIcon from "../../../assets/calendar.svg?react";
import * as Styled from "../../PreviewModal.styles";
import { EMPTY_VALUE } from "./constants";
import { SidebarReleaseDateChangeBanner } from "./SidebarReleaseDateChangeBanner";

interface SidebarReleaseDateRowProps {
  onEditClick?: () => void;
  expectedReleaseDate: Date | null;
  /** Provider viewers only — replaces the plain row with the dismissible banner. */
  alert?: ReleaseDateChangedAlert;
  onDismissAlert?: (alertId: string) => void;
}

export const SidebarReleaseDateRow: React.FC<SidebarReleaseDateRowProps> =
  function SidebarReleaseDateRow({
    onEditClick,
    expectedReleaseDate,
    alert,
    onDismissAlert,
  }) {
    if (alert) {
      return (
        <SidebarReleaseDateChangeBanner
          expectedReleaseDate={expectedReleaseDate}
          deltaDays={alert.metadata.deltaDays}
          onDismiss={() => onDismissAlert?.(alert.id)}
        />
      );
    }

    return (
      <Styled.DateRow>
        <Styled.DateInner>
          <Styled.DateValue>
            {expectedReleaseDate
              ? formatCalendarDate(expectedReleaseDate)
              : EMPTY_VALUE}
          </Styled.DateValue>
          <Styled.DateLabel>Release date</Styled.DateLabel>
        </Styled.DateInner>
        {onEditClick && (
          <Styled.DateIcon
            type="button"
            aria-label="Update release date"
            onClick={onEditClick}
          >
            <CalendarIcon />
          </Styled.DateIcon>
        )}
      </Styled.DateRow>
    );
  };
