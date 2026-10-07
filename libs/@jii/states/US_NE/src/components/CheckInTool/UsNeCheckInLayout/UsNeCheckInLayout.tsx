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

import type { ReactNode } from "react";

import { CheckInSectionId } from "~@jii/configs";
import { useHeaderOverride, WordmarkIcon } from "~@jii/layout";
import { useUsNeTranslations } from "~@jii/translation";

import { UsNeCheckInSectionProgress } from "../UsNeCheckInSectionProgress/UsNeCheckInSectionProgress";
import {
  Content,
  Header,
  HeaderActionButton,
  Title,
  Wrapper,
} from "./UsNeCheckInLayout.styles";

type CheckInLayoutProps = {
  onCloseClick: () => void;
  sectionId?: CheckInSectionId;
  children: ReactNode;
};

/**
 * Full-screen takeover that displays an overall header about the Check-In,
 * section information, and an action button.
 */
export const UsNeCheckInLayout = ({
  onCloseClick,
  sectionId,
  children,
}: CheckInLayoutProps) => {
  const { t } = useUsNeTranslations();
  useHeaderOverride();

  return (
    <Wrapper>
      <Header>
        <Title>
          <WordmarkIcon />
          {t(($) => $.checkIn.header.title)}
        </Title>
        <HeaderActionButton type="button" onClick={onCloseClick}>
          {t(($) => $.checkIn.header.close)}
        </HeaderActionButton>
      </Header>

      {sectionId && <UsNeCheckInSectionProgress section={sectionId} />}

      <Content>{children}</Content>
    </Wrapper>
  );
};
