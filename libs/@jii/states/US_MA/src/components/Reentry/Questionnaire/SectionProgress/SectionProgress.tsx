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

import { useId } from "react";

import { useUsMaTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

import { QuestionnaireSectionDisplay } from "../types";
import { SectionListItem } from "./SectionListItem";
import {
  ChevronButton,
  HeaderRow,
  Inner,
  ProgressFill,
  ProgressTrack,
  SectionCount,
  SectionLabel,
  SectionListPanel,
  Wrapper,
} from "./SectionProgress.styles";
import { SectionVariant } from "./types";

export type SectionProgressProps = {
  sections: QuestionnaireSectionDisplay[];
  currentSectionIndex: number;
  isOpen: boolean;
  onToggle: () => void;
};

function getSectionVariant(
  index: number,
  currentSectionIndex: number,
): SectionVariant {
  if (index < currentSectionIndex) return "completed";
  if (index === currentSectionIndex) return "current";
  return "upcoming";
}

export const SectionProgress = ({
  sections,
  currentSectionIndex,
  isOpen,
  onToggle,
}: SectionProgressProps) => {
  const { t } = useUsMaTranslations();
  const panelId = useId();

  const currentSection = sections[currentSectionIndex];
  const currentSectionNumber = currentSectionIndex + 1;
  const percent = Math.round((currentSectionNumber / sections.length) * 100);

  const sectionNumberText = t(
    ($) => $.reentry.questionnaire.sectionProgress.sectionNumber,
    { number: currentSectionNumber },
  );
  const sectionTotalText = t(
    ($) => $.reentry.questionnaire.sectionProgress.sectionTotal,
    { total: sections.length },
  );
  const toggleLabel = t(
    ($) => $.reentry.questionnaire.sectionProgress.toggleSections,
  );

  const toggleSections = () => {
    if (!isOpen) window.scrollTo({ top: 0 });
    onToggle();
  };

  return (
    <Wrapper>
      <Inner>
        <HeaderRow>
          <SectionLabel>{currentSection.label}</SectionLabel>
          <SectionCount>
            <span>
              <strong>{sectionNumberText}</strong> {sectionTotalText}
            </span>
            <ChevronButton
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={toggleLabel}
              onClick={toggleSections}
            >
              <Icon
                kind="ChevronDown"
                size={22}
                strokeWidth={2.5}
                rotate={isOpen ? 180 : 0}
              />
            </ChevronButton>
          </SectionCount>
        </HeaderRow>

        <ProgressTrack>
          <ProgressFill $percent={percent} />
        </ProgressTrack>

        {isOpen && (
          <SectionListPanel id={panelId}>
            {sections.map((section, index) => (
              <SectionListItem
                key={section.domain}
                number={index + 1}
                label={section.label}
                variant={getSectionVariant(index, currentSectionIndex)}
              />
            ))}
          </SectionListPanel>
        )}
      </Inner>
    </Wrapper>
  );
};
