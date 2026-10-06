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

import { ReactNode } from "react";

import { useHeaderOverride, WordmarkIcon } from "~@jii/layout";
import { useUsMaTranslations } from "~@jii/translation";

import {
  SectionProgress,
  SectionProgressProps,
} from "../SectionProgress/SectionProgress";
import {
  Content,
  Header,
  HeaderActionButton,
  Title,
  Wrapper,
} from "./QuestionnaireLayout.styles";

type QuestionnaireLayoutProps = {
  headerAction?: { label: string; onClick: () => void; disabled?: boolean };
  sectionProgress?: SectionProgressProps;
  children: ReactNode;
};

export const QuestionnaireLayout = ({
  headerAction,
  sectionProgress,
  children,
}: QuestionnaireLayoutProps) => {
  const { t } = useUsMaTranslations();
  useHeaderOverride();

  return (
    <Wrapper>
      <Header>
        <Title>
          <WordmarkIcon />
          {t(($) => $.reentry.questionnaire.header.title)}
        </Title>
        {headerAction && (
          <HeaderActionButton
            type="button"
            onClick={headerAction.onClick}
            disabled={headerAction.disabled}
          >
            {headerAction.label}
          </HeaderActionButton>
        )}
      </Header>

      {sectionProgress && <SectionProgress {...sectionProgress} />}
      <Content>{children}</Content>
    </Wrapper>
  );
};
