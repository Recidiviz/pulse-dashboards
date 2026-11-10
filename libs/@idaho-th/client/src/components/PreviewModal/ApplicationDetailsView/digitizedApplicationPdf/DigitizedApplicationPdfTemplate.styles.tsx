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

import { palette, spacing } from "../../../../styles";

export const PDF_PAGE_W = 140.625;
export const PDF_PAGE_H = 206.25;

const label = palette.foreground.secondary;
const text = palette.foreground.primary;

export const Page = styled.div`
  background: ${palette.background.primary};
  box-sizing: border-box;
  color: ${text};
  font-size: 2.375rem;
  font-style: normal;
  font-weight: 500;
  height: ${PDF_PAGE_H}rem;
  line-height: 1.2;
  min-height: ${PDF_PAGE_H}rem;
  overflow: hidden;
  padding: 8.4375rem 9.375rem 12.5rem 9.375rem;
  position: relative;
  width: ${PDF_PAGE_W}rem;
`;

export const TopBar = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 5.3125rem;
`;

export const BrandCluster = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: 0.375rem;
`;

export const BrandIcon = styled.div`
  flex-shrink: 0;
  height: 5rem;
  position: relative;
  width: 5rem;
`;

export const BrandSquare = styled.div`
  background: ${text};
  height: 2.5rem;
  left: 0;
  position: absolute;
  top: ${spacing[8]};
  width: 2.5rem;
`;

export const BrandCircle = styled.div`
  background: ${text};
  border-radius: 50%;
  height: 2.6875rem;
  left: 2.3125rem;
  position: absolute;
  top: 0;
  width: 2.6875rem;
`;

export const Wordmark = styled.div`
  color: ${text};
  font-size: 2rem;
  font-weight: 600;
  padding: 0.375rem 0 0 ${spacing[1]};
`;

export const DigitizedBy = styled.div`
  font-size: 3rem;
  font-weight: 500;
  line-height: 1.3;
  max-width: 50%;
  text-align: right;
`;

export const Hero = styled.div`
  margin-bottom: 5rem;
`;

export const HeroName = styled.h1`
  font-size: 6rem;
  font-weight: 600;
  line-height: 1.1;
  margin: 0 0 ${spacing[6]} 0;
`;

export const HeroLine = styled.p`
  font-size: 3rem;
  font-weight: 500;
  line-height: 1.3;
  margin: 0 0 ${spacing[5]} 0;
`;

export const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6.25rem;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${spacing[8]};
`;

export const SectionTitle = styled.h2`
  font-size: 2.875rem;
  font-weight: 500;
  line-height: 1.2;
  margin: 0;
  text-transform: uppercase;
`;

export const SubsectionWrapper = styled.div<{ $gap?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap ?? "3.125rem"};
`;

export const Subsection = styled.div<{ $gap?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => $gap ?? "2.5rem"};
`;

export const SubsectionTitle = styled.h3`
  color: ${text};
  font-size: 2.375rem;
  font-weight: 500;
  line-height: 1.03;
  margin: 0;
  text-transform: uppercase;
`;

const FIELD_ROW_COLUMNS: Record<1 | 2 | 3, string> = {
  1: "1fr",
  2: "1fr 1fr",
  3: "1fr 1fr 1fr",
};

export const FieldRow = styled.div<{ $cols?: 1 | 2 | 3 }>`
  display: grid;
  grid-template-columns: ${({ $cols = 3 }) => FIELD_ROW_COLUMNS[$cols]};
  gap: 3.125rem 3.125rem;
  align-items: start;
`;

export const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9375rem;
  min-width: 0;
`;

export const FieldLabel = styled.div`
  color: ${label};
  font-size: 2.375rem;
  font-weight: 500;
  line-height: 1.03;
`;

export const QuestionNumber = styled.span`
  color: ${palette.misc.primaryMuted};
`;

export const FieldValue = styled.div`
  color: ${text};
  font-size: 2.375rem;
  font-weight: 500;
  line-height: 1.03;
  word-break: break-word;
`;

export const LongTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  padding: 0.75rem 0;
`;

export const LongTextLabel = styled.div`
  color: ${label};
  font-size: 2.375rem;
  font-weight: 500;
  line-height: 1.03;
`;

export const LongTextValue = styled.div`
  color: ${text};
  font-size: 2.375rem;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
`;

export const HRule = styled.hr`
  border: none;
  border-top: 0.15rem solid #cccccc;
  height: 0;
  margin: 0;
  width: 100%;
`;

export const PageFooter = styled.div`
  align-items: center;
  bottom: 5.625rem;
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  left: 50%;
  max-width: calc(100% - 18.75rem);
  position: absolute;
  text-align: center;
  transform: translateX(-50%);
  width: 60rem;
`;

export const PageFooterLine = styled.div`
  color: ${text};
  font-size: 2.5rem;
  font-weight: 500;
  line-height: 1.3;
`;
