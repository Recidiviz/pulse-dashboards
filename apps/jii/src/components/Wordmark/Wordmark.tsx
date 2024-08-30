// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { rem } from "polished";
import { FC, memo } from "react";
import styled from "styled-components/macro";

import wordmarkUrl from "../../assets/images/wordmark.svg";
import wordmarkHighContrastUrl from "../../assets/images/wordmark-hc-wob.svg";

const Img = styled.img`
  display: block;
  height: auto;
  width: ${rem(132)};

  @media (forced-colors: active) and (prefers-color-scheme: dark) {
    display: none;
  }
`;

const ImgHighContrastWhite = styled(Img)`
  display: none;
  @media (forced-colors: active) and (prefers-color-scheme: dark) {
    display: block;
  
`;

type WordmarkProps = {
  width?: number;
};

export const Wordmark: FC<WordmarkProps> = memo(function Wordmark({ width }) {
  return (
    <>
      <Img
        src={wordmarkUrl}
        alt="Opportunities"
        style={width ? { width: rem(width) } : undefined}
      />
      <ImgHighContrastWhite
        src={wordmarkHighContrastUrl}
        alt="Opportunities"
        style={width ? { width: rem(width) } : undefined}
      />
    </>
  );
});
