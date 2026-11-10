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

import { formatReleaseDateChange } from "~@idaho-th/client/utils/applications";
import { formatCalendarDate } from "~@idaho-th/client/utils/date";

import XIcon from "../../../assets/x.svg?react";
import * as Styled from "../../PreviewModal.styles";

interface SidebarReleaseDateChangeBannerProps {
  expectedReleaseDate: Date | null;
  deltaDays: number;
  onDismiss: () => void;
}

export const SidebarReleaseDateChangeBanner: React.FC<
  SidebarReleaseDateChangeBannerProps
> = ({ expectedReleaseDate, deltaDays, onDismiss }) => (
  <Styled.ReleaseDateChangeBanner>
    <Styled.ReleaseDateChangeText>
      <Styled.DateWrapper>
        <Styled.ReleaseDateChangeDot />
        <Styled.ReleaseDateChangeDate>
          {formatCalendarDate(expectedReleaseDate)}
        </Styled.ReleaseDateChangeDate>
      </Styled.DateWrapper>
      <Styled.ReleaseDateChangeCaption>
        {formatReleaseDateChange(deltaDays, { withReleaseDatePrefix: true })}
      </Styled.ReleaseDateChangeCaption>
    </Styled.ReleaseDateChangeText>
    <Styled.ReleaseDateChangeDismissButton
      type="button"
      aria-label="Dismiss release date change"
      onClick={onDismiss}
    >
      <XIcon />
    </Styled.ReleaseDateChangeDismissButton>
  </Styled.ReleaseDateChangeBanner>
);
