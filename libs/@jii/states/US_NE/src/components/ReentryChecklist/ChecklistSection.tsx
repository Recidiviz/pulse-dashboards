// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import Markdown from "markdown-to-jsx";
import { rem } from "polished";
import { useState } from "react";
import styled from "styled-components";

import { Checkbox } from "~@jii/common-ui";
import { Icon, palette } from "~design-system";

const Container = styled.div<{ $isDisabled: boolean }>`
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(8)};
  margin-bottom: ${rem(spacing.md)};
  opacity: ${(props) => (props.$isDisabled ? 0.5 : 1)};
  transition: opacity 0.2s ease;
  background-color: ${palette.white};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} ${rem(spacing.xl)};
  cursor: pointer;
  gap: ${rem(spacing.md)};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
  flex: 1;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(2)};
  flex: 1;
`;

const Title = styled.h2`
  ${typography.Sans18};
  font-weight: 600;
  margin: 0;
  color: ${palette.pine2};
`;

const Subtitle = styled.p`
  ${typography.Sans14};
  margin: 0;
  color: ${palette.slate70};
`;

const Chevron = styled.div<{ $isExpanded: boolean }>`
  transition: transform 0.2s ease;
  transform: ${(props) =>
    props.$isExpanded ? "rotate(0deg)" : "rotate(-90deg)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Check = styled.div<{ $isComplete: boolean }>`
  width: ${rem(24)};
  height: ${rem(24)};
  border-radius: ${(props) => (props.$isComplete ? "50%" : "0")};
  background-color: ${(props) =>
    props.$isComplete ? palette.signal.links : "transparent"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Content = styled.div<{ $isExpanded: boolean }>`
  padding: 0 ${rem(spacing.xl)} ${rem(spacing.lg)};
  display: ${(props) => (props.$isExpanded ? "block" : "none")};
`;

const Item = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.sm)} 0;
  cursor: pointer;

  &:first-child {
    padding-top: 0;
  }
`;

const ItemText = styled(Markdown)`
  ${typography.Sans16};
  color: ${palette.slate90};
  margin-top: ${rem(3)};
`;

interface ChecklistSectionProps {
  section: {
    id: string;
    title: string;
    subtitle: string;
    items: Array<{ id: string; text: string }>;
  };
  isEnabled: boolean;
  checklistState: Record<string, boolean>;
  onToggleCheckbox: (itemId: string) => void;
}

export function ChecklistSection({
  section,
  isEnabled,
  checklistState,
  onToggleCheckbox,
}: ChecklistSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isEnabled);

  const allItemsChecked = section.items.every(
    (item) => checklistState[item.id],
  );

  return (
    <Container $isDisabled={!isEnabled}>
      <Header onClick={() => setIsExpanded(!isExpanded)}>
        <HeaderLeft>
          <Chevron $isExpanded={isExpanded}>
            <Icon kind="DownChevron" width={rem(8)} height={rem(4)} />
          </Chevron>
          <HeaderContent>
            <Title>{section.title}</Title>
            <Subtitle>{section.subtitle}</Subtitle>
          </HeaderContent>
        </HeaderLeft>
        <Check $isComplete={allItemsChecked}>
          <Icon
            kind="Check"
            size={12}
            color={allItemsChecked ? palette.white : palette.slate70}
          />
        </Check>
      </Header>
      <Content $isExpanded={isExpanded}>
        {section.items.map((item) => {
          const isChecked = checklistState[item.id] || false;
          return (
            <Item key={item.id}>
              <Checkbox
                $size={24}
                checked={isChecked}
                onChange={() => onToggleCheckbox(item.id)}
                id={item.id}
              />
              <ItemText>{item.text}</ItemText>
            </Item>
          );
        })}
      </Content>
    </Container>
  );
}
