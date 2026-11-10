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

import {
  BodyM1,
  BodyM2,
  BodyS1,
  BodyS2,
  borderRadius,
  Heading1,
  Heading3,
  palette,
  spacing,
} from "../../styles";

export const Panel = styled.div`
  background-color: ${palette.background.primary};
  border-radius: ${borderRadius[12]};
  border: 1px solid ${palette.border.subtle};
  display: flex;
  flex-direction: column;
  gap: ${spacing[6]};
  max-width: 32rem;
  padding: ${spacing[8]};
  width: 100%;
`;

export const Title = styled(Heading3)`
  color: ${palette.foreground.primary};
`;

export const Description = styled(BodyM1)`
  color: ${palette.foreground.secondary};
`;

export const PageContainer = styled.div`
  background-color: ${palette.misc.paleSilver};
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
`;

export const PageContent = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${spacing[6]};
  margin: 0 auto;
  max-width: 72rem;
  padding: ${spacing[8]} ${spacing[7]};
  width: 100%;

  @media (max-width: 40rem) {
    padding: ${spacing[6]} ${spacing[4]};
  }
`;

export const PageHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
`;

export const BackButton = styled(BodyS2).attrs({
  as: "button",
  type: "button",
})`
  align-items: center;
  align-self: flex-start;
  background: none;
  border-radius: ${borderRadius[8]};
  border: 0;
  color: ${palette.foreground.secondary};
  cursor: pointer;
  display: inline-flex;
  gap: ${spacing[1]};
  margin-bottom: ${spacing[2]};
  padding: ${spacing[1]} ${spacing[2]} ${spacing[1]} ${spacing[0]};

  &:hover {
    background: ${palette.state.hover};
    color: ${palette.foreground.primary};
  }

  &:active {
    background: ${palette.state.active};
  }

  &:focus-visible {
    box-shadow: ${palette.shadow.brand};
    outline: none;
  }

  & svg {
    flex-shrink: 0;
    height: 1rem;
    width: 1rem;
  }
`;

export const PageTitle = styled(Heading1)`
  color: ${palette.foreground.primary};
`;

export const HousingProviderList = styled.ul`
  display: grid;
  gap: ${spacing[4]};
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 40rem) {
    grid-template-columns: 1fr;
  }
`;

export const HousingProviderButton = styled.button`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  border: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: ${spacing[2]};
  min-height: 7rem;
  padding: ${spacing[4]};
  text-align: left;
  transition:
    background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
  width: 100%;

  &:hover {
    background: ${palette.state.hover};
    border-color: ${palette.border.brand};
  }

  &:active {
    background: ${palette.state.active};
    border-color: ${palette.border.brand};
  }

  &:focus-visible {
    border-color: ${palette.border.brand};
    box-shadow: ${palette.shadow.brand};
    outline: none;
  }
`;

// A `<button>` only accepts phrasing content, so the token typography
// components render as spans rather than their default paragraph tag.
export const HousingProviderName = styled(BodyM2).attrs({ as: "span" })`
  color: ${palette.foreground.primary};
`;

export const HousingProviderDetail = styled(BodyS1).attrs({ as: "span" })`
  color: ${palette.foreground.secondary};
`;
