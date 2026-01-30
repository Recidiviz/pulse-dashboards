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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, ReactNode, useState } from "react";
import styled from "styled-components";

import { useUsCoTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

const Section = styled.div``;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  cursor: pointer;
`;

const Chevron = styled(Icon).attrs({ kind: "Next" })<{
  $isExpanded: boolean;
  kind?: never;
}>`
  transition: transform 0.2s ease;
  transform: ${(props) =>
    props.$isExpanded ? "rotate(90deg)" : "rotate(0deg)"};
`;

const CategoryName = styled.span`
  ${typography.Sans16};
`;

const ProgramCountBadge = styled.span`
  ${typography.Sans12};
  background-color: rgba(43, 84, 105, 0.05);
  padding: ${rem(2)} ${rem(spacing.sm)};
  border-radius: ${rem(12)};
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
`;

interface CategorySectionProps {
  categoryName: string;
  programCount: number;
  totalCount?: number;
  children: ReactNode;
  defaultExpanded?: boolean;
}

// TODO(#11610) Set this up as details/summary for better accessibility
export const CategorySection: FC<CategorySectionProps> = ({
  categoryName,
  programCount,
  totalCount,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useUsCoTranslations();

  const showFilteredCount =
    totalCount !== undefined && totalCount > programCount;

  return (
    <Section>
      <Header onClick={() => setIsExpanded(!isExpanded)}>
        <Chevron $isExpanded={isExpanded} size={16} />
        <CategoryName>{categoryName}</CategoryName>
        <ProgramCountBadge>
          {showFilteredCount
            ? t(($) => $.programs.category.programCountFiltered, {
                count: programCount,
                total: totalCount,
              })
            : t(($) => $.programs.category.programCount, {
                count: programCount,
              })}
        </ProgramCountBadge>
      </Header>
      {isExpanded && <Content>{children}</Content>}
    </Section>
  );
};
