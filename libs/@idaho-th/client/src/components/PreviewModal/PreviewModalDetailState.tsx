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

import { BodyS1 } from "../../styles";
import { Spinner } from "../common/LoadingSpinner/Spinner";
import * as Styled from "./PreviewModal.styles";

interface PreviewModalDetailStateProps {
  isLoading: boolean;
  isError: boolean;
  children: React.ReactNode;
}

export const PreviewModalDetailState: React.FC<
  PreviewModalDetailStateProps
> = ({ isLoading, isError, children }) => {
  if (isLoading) {
    return (
      <Styled.DetailStateContainer>
        <Spinner size="2rem" />
      </Styled.DetailStateContainer>
    );
  }

  if (isError) {
    return (
      <Styled.DetailStateContainer>
        <BodyS1>Application not found or unavailable.</BodyS1>
      </Styled.DetailStateContainer>
    );
  }

  return <>{children}</>;
};
