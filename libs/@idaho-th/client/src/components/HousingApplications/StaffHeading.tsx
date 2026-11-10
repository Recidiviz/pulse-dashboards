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

import React from "react";

import useIsMobile from "../../hooks/useIsMobile";
import { Button2 } from "../../styles";
import * as Styled from "./HousingApplications.styles";
import { SearchBar } from "./SearchBar";

interface StaffHeadingProps {
  onUploadPdf?: () => void;
  onSearchChange: (value: string) => void;
  subtitle: string;
  title: string;
}

export const StaffHeading: React.FC<StaffHeadingProps> = ({
  title,
  subtitle,
  onUploadPdf,
  onSearchChange,
}) => {
  const { isMobile } = useIsMobile(true);

  return (
    <Styled.PageHeadingWrapper>
      <Styled.PageHeadingTitleGroup>
        <Styled.PageHeadingTitleRow>
          <Styled.PageHeadingTitle>{title}</Styled.PageHeadingTitle>
          <Styled.PageHeadingBetaChip>
            <Styled.PageHeadingBetaChipText>
              Beta
            </Styled.PageHeadingBetaChipText>
          </Styled.PageHeadingBetaChip>
        </Styled.PageHeadingTitleRow>
        <Styled.PageHeadingSubtitle>{subtitle}</Styled.PageHeadingSubtitle>
      </Styled.PageHeadingTitleGroup>

      <Styled.PageHeadingActions>
        <SearchBar onSearchChange={onSearchChange} />
        {!isMobile && (
          <Styled.UploadButton type="button" onClick={onUploadPdf}>
            <Button2>Start an application</Button2>
          </Styled.UploadButton>
        )}
      </Styled.PageHeadingActions>
    </Styled.PageHeadingWrapper>
  );
};
