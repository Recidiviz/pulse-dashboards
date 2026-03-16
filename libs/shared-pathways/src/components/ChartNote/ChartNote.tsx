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
import { Link } from "react-router-dom";
import styled from "styled-components";

const Wrapper = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 14px;
  color: ${({ theme }) => theme.palette.slate80};
  margin-top: 12px;
  margin-bottom: 1.375rem;
`;

const MethodologyLink = styled(Link)`
  color: ${({ theme }) => theme.palette.signal.links};
  padding-left: 5px;

  &:hover {
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.signal.links};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

type MethodologyLinkProps = {
  pathname: string;
  hash: string;
  search: string;
};

type ChartNoteProps = {
  note?: string;
  isLoading?: boolean;
  methodologyLink?: MethodologyLinkProps;
};

const ChartNote: React.FC<ChartNoteProps> = ({
  note,
  isLoading = false,
  methodologyLink,
}) => {
  if (isLoading || !note) {
    return (
      <Wrapper>
        <br />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <strong>Note: </strong>
      {note}
      {methodologyLink && (
        <MethodologyLink to={methodologyLink} target="_blank">
          See full methodology →
        </MethodologyLink>
      )}
    </Wrapper>
  );
};

export default ChartNote;
