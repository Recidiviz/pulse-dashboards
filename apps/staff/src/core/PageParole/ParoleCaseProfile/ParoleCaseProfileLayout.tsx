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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { ReactNode } from "react";
import styled from "styled-components";

import { BackLink } from "../../Link";
import { paroleUrl } from "../../views";
import { PAROLE_REPORT_CAPTURE_ID } from "../components/shared";

// Max-width and padding come from PageParole's Main wrapper.
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
  padding-bottom: 1.5rem;
`;

// Default stretch keeps the sidebar as tall as MainColumn, so its sticky nav
// can travel on scroll.
const CaseProfileLayout = styled.div`
  display: flex;
  gap: ${rem(spacing.lg)};
`;

const SidebarColumn = styled.div`
  flex: 0 0 30%;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const MainColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

// Groups the sections so the PDF capture picks up exactly this content, not
// the download card.
const ReportContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

/**
 * The shared frame around every state's Parole case profile: a back link, a
 * sidebar beside a main column, and the box the PDF download captures.
 *
 * @param sidebar - Case info card and section quick-nav.
 * @param beforeReport - Above the captured box, so it stays out of the PDF.
 * @param children - The report body, captured into the PDF.
 */
export function ParoleCaseProfileLayout({
  sidebar,
  beforeReport,
  children,
}: {
  sidebar: ReactNode;
  beforeReport?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Wrapper>
      <BackLink fallbackUrl={paroleUrl("docket")}>Back to Docket</BackLink>

      <CaseProfileLayout>
        <SidebarColumn>{sidebar}</SidebarColumn>

        <MainColumn>
          {beforeReport}
          <ReportContent id={PAROLE_REPORT_CAPTURE_ID}>
            {children}
          </ReportContent>
        </MainColumn>
      </CaseProfileLayout>
    </Wrapper>
  );
}
