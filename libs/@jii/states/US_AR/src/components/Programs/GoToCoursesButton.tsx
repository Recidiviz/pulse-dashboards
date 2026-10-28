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

import { FC } from "react";
import styled from "styled-components";

import { JIIButton } from "~@jii/common-ui";
import { sendEdovoReferral, useRootStore } from "~@jii/data";
import { useUsArTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

const CoursesButton = styled(JIIButton)`
  width: 100%;
  justify-content: center;
`;

export const GoToCoursesButton: FC = () => {
  const { t } = useUsArTranslations();
  const {
    userStore: { segmentClient },
  } = useRootStore();

  const handleGoToCourses = () => {
    if (sendEdovoReferral())
      segmentClient.trackEdovoReferralSent({ type: "program-navigation" });
  };

  return (
    <CoursesButton kind="primary" onClick={handleGoToCourses}>
      <span>{t(($) => $.programs.onMyTablet.coursesButton)}</span>
      <Icon kind="Open" size={12} />
    </CoursesButton>
  );
};
