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

import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Card, JIIButton, RowDivider, SlateCopy } from "~@jii/common-ui";
import { sendEdovoReferral, useRootStore } from "~@jii/data";
import { useUsArTranslations } from "~@jii/translation";
import { Icon, spacing } from "~design-system";

const CoursesButton = styled(JIIButton)`
  width: 100%;
  justify-content: center;
`;

const ExplainerDivider = styled(RowDivider)`
  margin-bottom: ${rem(spacing.md)};
`;

const TightSlateCopy = styled(SlateCopy)`
  margin-bottom: 0;

  p {
    margin-bottom: 0;
  }
`;

export const PolicyExplainerCard: FC = () => {
  const { t } = useUsArTranslations();
  const {
    userStore: { segmentClient },
  } = useRootStore();

  const handleGoToCourses = () => {
    if (sendEdovoReferral())
      segmentClient.trackEdovoReferralSent({ type: "program-navigation" });
  };

  return (
    <Card>
      <SlateCopy options={{ forceBlock: true }}>
        {t(($) => $.programs.onMyTablet.progressExplainer)}
      </SlateCopy>
      <ExplainerDivider />
      <TightSlateCopy options={{ forceBlock: true }}>
        {t(($) => $.programs.onMyTablet.carryOverUnder)}
      </TightSlateCopy>
      <SlateCopy options={{ forceBlock: true }}>
        {t(($) => $.programs.onMyTablet.carryOverOver)}
      </SlateCopy>
      {/* TODO(JII2-119): make this a link to the AR policy page */}
      <SlateCopy options={{ forceBlock: true }}>
        {t(($) => $.programs.onMyTablet.learnMore)}
      </SlateCopy>
      <CoursesButton kind="primary" onClick={handleGoToCourses}>
        <span>{t(($) => $.programs.onMyTablet.coursesButton)}</span>
        <Icon kind="Open" size={12} />
      </CoursesButton>
    </Card>
  );
};
