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

import { CheckInSectionId, checkInSections } from "~@jii/configs";
import { useUsNeTranslations } from "~@jii/translation";

import {
  HeaderRow,
  Inner,
  NextSection,
  ProgressFill,
  ProgressTrack,
  SectionLabel,
  Wrapper,
} from "./UsNeCheckInSectionProgress.styles";

type CheckInSectionProgressProps = {
  section: CheckInSectionId;
};

export const UsNeCheckInSectionProgress = ({
  section,
}: CheckInSectionProgressProps) => {
  const { t } = useUsNeTranslations();

  const sectionIndex = checkInSections.indexOf(section);

  if (sectionIndex === -1) {
    return null;
  }

  const sectionLabel = t(($) => $.checkIn.sections[section].title);

  const sectionNumber = sectionIndex + 1;
  const percent = Math.round(
    (sectionNumber / (checkInSections.length + 1)) * 100,
  );

  const showNextSection = sectionIndex < checkInSections.length - 1;

  return (
    <Wrapper>
      <Inner>
        <HeaderRow>
          <SectionLabel>{sectionLabel}</SectionLabel>
          {showNextSection && (
            <NextSection>
              <strong>{t(($) => $.checkIn.sectionHeader.next)}</strong>{" "}
              {t(
                ($) =>
                  $.checkIn.sections[checkInSections[sectionIndex + 1]].title,
              )}
            </NextSection>
          )}
        </HeaderRow>

        <ProgressTrack>
          <ProgressFill $percent={percent} />
        </ProgressTrack>
      </Inner>
    </Wrapper>
  );
};
