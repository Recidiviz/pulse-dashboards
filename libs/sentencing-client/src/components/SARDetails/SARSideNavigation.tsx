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
import { getDomainsForAssessmentType } from "../OffenderAssessment/utils";
import { ArrowIcon } from "./ArrowIcon";
import {
  OFFENDER_ASSESSMENT_SUBSECTIONS,
  OffenderAssessmentSubsection,
  SARSection,
  SARSectionName,
  SUBSECTION_TO_DOMAIN_KEY,
} from "./constants";
import * as Styled from "./SARSideNavigation.styles";
import { StatusIndicator } from "./StatusIndicator";

type SARSideNavigationProps = {
  currentSection: SARSectionName;
  onSectionChange: (section: SARSectionName) => void;
  currentSubsection?: string;
  onSubsectionChange?: (subsection: string | undefined) => void;
  presenter: SARDetailsPresenter;
};

export const SARSideNavigation: React.FC<SARSideNavigationProps> = observer(
  function SARSideNavigation({
    currentSection,
    onSectionChange,
    currentSubsection,
    onSubsectionChange,
    presenter,
  }) {
    const reportSections = presenter.SARSections;
    const currentIndex = reportSections.indexOf(currentSection);
    const totalSections = reportSections.length;
    const sectionStatuses = presenter.sectionStatuses;

    const assessmentType = presenter.SARData?.assessmentType;
    const visibleDomains = getDomainsForAssessmentType(assessmentType);
    const visibleSubsections = presenter.defendantDeclinedToParticipate
      ? [OffenderAssessmentSubsection.CRIMINAL_HISTORY]
      : OFFENDER_ASSESSMENT_SUBSECTIONS.filter((subsection) => {
          const domainKey = SUBSECTION_TO_DOMAIN_KEY[subsection];
          return visibleDomains.some((d) => d.key === domainKey);
        });

    const handlePrevious = () => {
      if (currentIndex > 0) {
        onSectionChange(reportSections[currentIndex - 1]);
      }
    };

    const handleNext = () => {
      if (currentIndex < totalSections - 1) {
        onSectionChange(reportSections[currentIndex + 1]);
      }
    };

    const isFirstSection = currentIndex === 0;
    const isLastSection = currentIndex === totalSections - 1;

    return (
      <Styled.SideContainer>
        <Styled.SideNavigationContainer>
          <Styled.NavigationList>
            {reportSections.map((section) => {
              const isActive = section === currentSection;
              const status =
                section !== SARSection.SUMMARY
                  ? sectionStatuses[section]
                  : "empty";
              const showSubsections =
                isActive && section === SARSection.OFFENDER_ASSESSMENT;

              return (
                <React.Fragment key={section}>
                  <Styled.NavigationItem
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

                  {showSubsections && (
                    <Styled.SubNavigationList>
                      {visibleSubsections.map((subsection) => (
                        <Styled.SubNavigationItem
                          key={subsection}
                          isActive={currentSubsection === subsection}
                          onClick={() => onSubsectionChange?.(subsection)}
                        >
                          {subsection}
                        </Styled.SubNavigationItem>
                      ))}
                    </Styled.SubNavigationList>
                  )}
                </React.Fragment>
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
