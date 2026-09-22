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

import { typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, useEffect } from "react";
import styled from "styled-components";

import { JIIButton } from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { useUsCoTranslations } from "~@jii/translation";
import { Icon, palette, spacing } from "~design-system";

const COPY_MIN_WIDTH = 280;

const Card = styled.div`
  ${typography.Sans14}

  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.lg)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(spacing.sm)};
  background: ${palette.slate05};
`;

const TabletIcon = styled(Icon)`
  flex: 0 0 auto;
`;

const Copy = styled.p`
  flex: 1 1 ${rem(COPY_MIN_WIDTH)};
  margin: 0;
  color: ${palette.slate85};
  line-height: 1.4;
`;

const Headline = styled.strong`
  color: ${palette.pine1};
  font-weight: 600;
`;

const CoursesButton = styled(JIIButton)`
  flex: 0 0 auto;
`;

type EdovoCoursesCardProps = {
  /** OBT-48952 Sends the resident out to Edovo.*/
  onGoToCourses: () => void;
};

/**
 * Points residents at the credit-earning Edovo courses on their tablet
 */
export const EdovoCoursesCard: FC<EdovoCoursesCardProps> = ({
  onGoToCourses,
}) => {
  const { t } = useUsCoTranslations();
  const {
    userStore: { segmentClient },
  } = useRootStore();

  useEffect(() => {
    segmentClient.trackAetCalloutImpression({ placement: "programCatalog" });
  }, [segmentClient]);

  const handleGoToCourses = () => {
    segmentClient.trackAetCalloutClicked({ placement: "programCatalog" });
    onGoToCourses();
  };

  return (
    <Card>
      <TabletIcon kind="Tablet" size={28} color={palette.slate85} aria-hidden />
      <Copy>
        <Headline>{t(($) => $.programs.edovoCard.heading)}</Headline>{" "}
        {t(($) => $.programs.edovoCard.body)}
      </Copy>
      <CoursesButton kind="primary" onClick={handleGoToCourses}>
        <span>{t(($) => $.programs.edovoCard.coursesButton)}</span>
        <Icon kind="Arrow" size={12} />
      </CoursesButton>
    </Card>
  );
};
