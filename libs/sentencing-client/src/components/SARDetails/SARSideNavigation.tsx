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

import { observer } from "mobx-react-lite";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { ArrowIcon } from "./ArrowIcon";
import { SAR_REPORT_SECTIONS, SARSectionName } from "./constants";
import * as Styled from "./SARSideNavigation.styles";
import { StatusIndicator } from "./StatusIndicator";

type SARSideNavigationProps = {
  currentSection: SARSectionName;
  onSectionChange: (section: SARSectionName) => void;
  presenter: SARDetailsPresenter;
};

export const SARSideNavigation: React.FC<SARSideNavigationProps> = observer(
  function SARSideNavigation({ currentSection, onSectionChange, presenter }) {
    const currentIndex = SAR_REPORT_SECTIONS.indexOf(currentSection);
    const totalSections = SAR_REPORT_SECTIONS.length;
    const sectionStatuses = presenter.sectionStatuses;

    const handlePrevious = () => {
      if (currentIndex > 0) {
        onSectionChange(SAR_REPORT_SECTIONS[currentIndex - 1]);
      }
    };

    const handleNext = () => {
      if (currentIndex < totalSections - 1) {
        onSectionChange(SAR_REPORT_SECTIONS[currentIndex + 1]);
      }
    };

    const isFirstSection = currentIndex === 0;
    const isLastSection = currentIndex === totalSections - 1;

    return (
      <Styled.SideContainer>
        <Styled.SideNavigationContainer>
          <Styled.NavigationList>
            {SAR_REPORT_SECTIONS.map((section) => {
              const isActive = section === currentSection;
              const status = sectionStatuses[section];
              return (
                <Styled.NavigationItem
                  key={section}
                  isActive={isActive}
                  onClick={() => onSectionChange(section)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Styled.StatusIconWrapper>
                    <StatusIndicator status={status} />
                  </Styled.StatusIconWrapper>
                  {section}
                  {isActive && (
                    <Styled.Arrow>
                      <ArrowIcon />
                    </Styled.Arrow>
                  )}
                </Styled.NavigationItem>
              );
            })}
          </Styled.NavigationList>

          <Styled.ButtonContainer>
            <Styled.NavButton
              variant="secondary"
              onClick={handlePrevious}
              disabled={isFirstSection}
            >
              Previous
            </Styled.NavButton>
            <Styled.NavButton
              variant="primary"
              onClick={handleNext}
              disabled={isLastSection}
            >
              Next
            </Styled.NavButton>
          </Styled.ButtonContainer>
        </Styled.SideNavigationContainer>
        <Styled.AutosaveMessage>
          Exit any time, your progress is auto-saved.
        </Styled.AutosaveMessage>
      </Styled.SideContainer>
    );
  },
);
