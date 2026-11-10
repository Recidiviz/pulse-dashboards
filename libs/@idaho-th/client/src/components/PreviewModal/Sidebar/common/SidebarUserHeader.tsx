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

import { getAvatarInitials } from "../../../HousingApplications/ApplicationsTable/utils";
import * as Styled from "../../PreviewModal.styles";
import { EMPTY_VALUE } from "./constants";

interface SidebarUserHeaderProps {
  clientName: string | undefined;
}

export const SidebarUserHeader: React.FC<SidebarUserHeaderProps> =
  function SidebarUserHeader({ clientName }) {
    const initials = getAvatarInitials(clientName ?? "");

    return (
      <Styled.UserNameRow>
        <Styled.UserNameInner>
          <Styled.Avatar>{initials}</Styled.Avatar>
          <Styled.ClientName>{clientName ?? EMPTY_VALUE}</Styled.ClientName>
        </Styled.UserNameInner>
      </Styled.UserNameRow>
    );
  };
