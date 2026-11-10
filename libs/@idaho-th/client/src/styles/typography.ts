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

import styled, { css } from "styled-components";

export const fontWeights = {
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
} as const;

export const fontFamilies = {
  inter: `"Inter", Helvetica, sans-serif`,
} as const;

export const fontSizes = {
  heading1: "32px",
  heading2: "28px",
  heading3: "24px",
  heading4: "20px",
  heading5: "18px",
  bodyM: "16px",
  bodyS: "14px",
  caption: "12px",
} as const;

export const letterSpacings = {
  heading1: "-0.64px",
  heading2: "-0.56px",
  heading3: "-0.56px",
  heading4: "-0.4px",
  heading5: "-0.36px",
  bodyM: "-0.32px",
  bodyS: "-0.28px",
  caption: "-0.24px",
} as const;

export interface TypographyProps {
  $fontSize?: string;
  $fontWeight?: number;
  $lineHeight?: string;
  $letterSpacing?: string;
  $color?: string;
}

const overrides = css<TypographyProps>`
  ${({ $fontSize }) => $fontSize && `font-size: ${$fontSize};`}
  ${({ $fontWeight }) =>
    $fontWeight !== undefined && `font-weight: ${$fontWeight};`}
  ${({ $lineHeight }) => $lineHeight && `line-height: ${$lineHeight};`}
  ${({ $letterSpacing }) =>
    $letterSpacing && `letter-spacing: ${$letterSpacing};`}
  ${({ $color }) => $color && `color: ${$color};`}
`;

export const interBase = css<TypographyProps>`
  font-family: ${fontFamilies.inter};
  ${overrides}
`;

export const serifBase = css<TypographyProps>`
  font-family: "Libre Baskerville", Georgia, serif;
  ${overrides}
`;

export const Heading1 = styled.h1<TypographyProps>`
  font-size: ${fontSizes.heading1};
  font-weight: ${fontWeights.bold};
  line-height: 44px;
  letter-spacing: ${letterSpacings.heading1};
  margin: 0;
  ${serifBase}
`;

export const Heading2 = styled.h2<TypographyProps>`
  font-size: ${fontSizes.heading2};
  font-weight: ${fontWeights.bold};
  line-height: 40px;
  letter-spacing: ${letterSpacings.heading2};
  margin: 0;
  ${serifBase}
`;

export const Heading3 = styled.h3<TypographyProps>`
  font-size: ${fontSizes.heading3};
  font-weight: ${fontWeights.semiBold};
  line-height: 32px;
  letter-spacing: ${letterSpacings.heading3};
  margin: 0;
  ${interBase}
`;

export const Heading4 = styled.h4<TypographyProps>`
  font-size: ${fontSizes.heading4};
  font-weight: ${fontWeights.semiBold};
  line-height: 28px;
  letter-spacing: ${letterSpacings.heading4};
  margin: 0;
  ${interBase}
`;

export const Heading5 = styled.h5<TypographyProps>`
  font-size: ${fontSizes.heading5};
  font-weight: ${fontWeights.semiBold};
  line-height: 26px;
  letter-spacing: ${letterSpacings.heading5};
  margin: 0;
  ${interBase}
`;

export const Button1 = styled.span<TypographyProps>`
  font-size: ${fontSizes.bodyM};
  font-weight: ${fontWeights.semiBold};
  line-height: 18px;
  letter-spacing: ${letterSpacings.bodyM};
  ${interBase}
`;

export const Button2 = styled.span<TypographyProps>`
  font-size: ${fontSizes.bodyS};
  font-weight: ${fontWeights.semiBold};
  line-height: 16px;
  letter-spacing: ${letterSpacings.bodyS};
  ${interBase}
`;

export const BodyM1 = styled.p<TypographyProps>`
  font-size: ${fontSizes.bodyM};
  font-weight: ${fontWeights.regular};
  line-height: 24px;
  letter-spacing: ${letterSpacings.bodyM};
  margin: 0;
  ${interBase}
`;

export const BodyM2 = styled.p<TypographyProps>`
  font-size: ${fontSizes.bodyM};
  font-weight: ${fontWeights.medium};
  line-height: 24px;
  letter-spacing: ${letterSpacings.bodyM};
  margin: 0;
  ${interBase}
`;

export const BodyS1 = styled.p<TypographyProps>`
  font-size: ${fontSizes.bodyS};
  font-weight: ${fontWeights.regular};
  line-height: 20px;
  letter-spacing: ${letterSpacings.bodyS};
  margin: 0;
  ${interBase}
`;

export const BodyS2 = styled.p<TypographyProps>`
  font-size: ${fontSizes.bodyS};
  font-weight: ${fontWeights.medium};
  line-height: 20px;
  letter-spacing: ${letterSpacings.bodyS};
  margin: 0;
  ${interBase}
`;

export const Caption1 = styled.span<TypographyProps>`
  font-size: ${fontSizes.caption};
  font-weight: ${fontWeights.regular};
  line-height: 16px;
  letter-spacing: ${letterSpacings.caption};
  ${interBase}
`;

export const Caption2 = styled.span<TypographyProps>`
  font-size: ${fontSizes.caption};
  font-weight: ${fontWeights.medium};
  line-height: 16px;
  letter-spacing: ${letterSpacings.caption};
  ${interBase}
`;
