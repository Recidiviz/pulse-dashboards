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
import styled from "styled-components";

import { AnnouncementBanner, CopyWrapper } from "~@jii/common-ui";
import {
  defaultComponents,
  SentenceDatesComponents,
} from "~@jii/sentence-dates";
import { useUsNycTranslations } from "~@jii/translation";
import { spacing } from "~design-system";

const HiddenSubHeading = styled(CopyWrapper)`
  display: block;
  margin-bottom: ${rem(spacing.md)};
`;

/**
 * Adds a sub-heading above the cards: an explanation of the hidden dockets
 * while they are hidden, or a banner reminding the resident that court dates
 * can move while they are shown.
 */
export const CardsWrapperOverride: SentenceDatesComponents["CardsWrapper"] = (
  props,
) => {
  const { t } = useUsNycTranslations();

  return (
    <>
      {props.hidden ? (
        <HiddenSubHeading>
          {t(($) => $.scheduledCourtDates.hiddenSubHeading)}
        </HiddenSubHeading>
      ) : (
        <AnnouncementBanner
          message={t(($) => $.scheduledCourtDates.visibleSubHeading)}
        />
      )}
      <defaultComponents.CardsWrapper {...props} />
    </>
  );
};
