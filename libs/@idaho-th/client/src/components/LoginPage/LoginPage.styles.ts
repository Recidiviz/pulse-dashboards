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
  BodyS1,
  borderRadius,
  Button1,
  palette,
  spacing,
} from "../../styles";

export const Page = styled.div`
  align-items: center;
  background-color: ${palette.background.screen};
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: ${spacing[4]};
`;

export const Card = styled.div`
  background: ${palette.background.primary};
  border-radius: ${borderRadius[4]};
  box-shadow: 0 0.75rem 2.5rem rgba(0, 0, 0, 0.12);
  max-width: 25rem;
  width: 100%;
`;

export const Header = styled.header`
  padding: ${spacing[8]} ${spacing[8]} ${spacing[6]};
  text-align: center;
`;

export const Logo = styled.img`
  display: block;
  height: 3.75rem;
  margin: 0 auto ${spacing[6]};
  width: auto;
`;

export const TitleWrapper = styled.div`
  margin-bottom: ${spacing[2]};
`;

export const FormSection = styled.div`
  padding: 0 ${spacing[8]} ${spacing[8]};
`;

export const InputWrapper = styled.div`
  margin-bottom: 0;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FieldLabel = styled(BodyS1)`
  color: ${palette.foreground.primary};
  display: block;
  margin-bottom: ${spacing[1]};
`;

export const RequiredMark = styled.span`
  color: ${palette.foreground.attention};
`;

export const EmailInput = styled(BodyM1)`
  border-radius: ${borderRadius[4]};
  border: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  padding: ${spacing[3]};
  width: 100%;

  &:focus {
    border-color: ${palette.border.brand};
    box-shadow: 0 0 0 0.0625rem ${palette.border.brand};
    outline: none;
  }

  &:disabled {
    opacity: 0.7;
  }
`;

export const FormError = styled.div`
  background: ${palette.background.attentionLight};
  border-radius: ${borderRadius[4]};
  border: 0.0625rem solid ${palette.background.attentionLightSecondary};
  margin-bottom: ${spacing[4]};
  padding: ${spacing[3]};
`;

export const ButtonRow = styled.div`
  margin-top: ${spacing[6]};
`;

export const SubmitButton = styled(Button1)`
  background: ${palette.background.brand};
  border-radius: ${borderRadius[4]};
  border: none;
  color: ${palette.foreground.onBrand};
  cursor: pointer;
  padding: ${spacing[3]} ${spacing[4]};
  width: 100%;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`;

export const HintText = styled.div`
  margin-top: ${spacing[3]};
`;

export const RoleChoiceWrapper = styled(InputWrapper)`
  margin-top: ${spacing[4]};
`;

export const RoleChoiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[2]};
`;
