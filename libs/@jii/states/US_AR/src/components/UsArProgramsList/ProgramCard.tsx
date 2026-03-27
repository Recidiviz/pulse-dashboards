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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Icon, palette } from "~design-system";

import { UsArProgram } from "../../presenters/UsArProgramsPresenter";
import { StarButton } from "./StarButton";

const CardContainer = styled.article`
  cursor: pointer;
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(8)};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover,
  &:focus {
    border-color: ${palette.slate40};
  }
`;

const TopSection = styled.div`
  background-color: ${palette.white};
  padding: ${rem(spacing.lg)};
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(spacing.sm)};
`;

// TODO(#11610) Make these proper headings
const Title = styled.div`
  ${typography.Sans16};
  color: ${palette.pine3};
  max-width: 80%;
`;

const Description = styled.p`
  ${typography.Sans12};
  color: ${palette.slate85};
  margin: ${rem(spacing.sm)} 0 0 0;
`;

export type ProgramCardProps = {
  program: UsArProgram;
  isStarred?: boolean;
  onToggleStar: (program: UsArProgram) => void;
  onClick: (program: UsArProgram) => void;
};

const ProgramCardComponent: FC<ProgramCardProps> = ({
  program,
  onToggleStar,
  onClick,
}) => {
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar?.(program);
  };

  return (
    <CardContainer onClick={() => onClick?.(program)}>
      <TopSection>
        <TitleRow>
          <Title>
            {program.title.slice(0, program.title.lastIndexOf(" ") + 1)}
            <span style={{ whiteSpace: "nowrap" }}>
              {program.title.slice(program.title.lastIndexOf(" ") + 1)}{" "}
              <Icon
                kind="Next"
                size={18}
                color={palette.slate60}
                style={{ verticalAlign: "top" }}
              />
            </span>
          </Title>
          <StarButton
            isStarred={program.isStarred}
            onClick={handleStarClick}
            size={20}
          />
        </TitleRow>
        <Description>{program.description}</Description>
      </TopSection>
    </CardContainer>
  );
};

export const ProgramCard = observer(ProgramCardComponent);
