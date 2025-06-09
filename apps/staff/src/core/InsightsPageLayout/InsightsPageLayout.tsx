// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { spacing, TooltipTrigger, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { now } from "mobx-utils";
import { rem } from "polished";
import { ReactNode, useEffect, useState } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { THIRTY_SECONDS } from "../../InsightsStore/presenters/utils";
import { humanReadableTitleCase } from "../../utils";
import { InsightsActionStrategyModal } from "../InsightsActionStrategyModal";
import InsightsInfoModal from "../InsightsInfoModal";

const PageWrapper = styled.div<{
  isMobile: boolean;
  $limitedWidth: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: 0 ${({ isMobile }) => (isMobile ? "0" : "56px")};
  ${(props) =>
    props.$limitedWidth &&
    `
      max-width: ${rem(1200)};
      margin: 0 auto;
    `}
`;

export const Wrapper = styled.div<{
  isLaptop: boolean;
  isFlex?: boolean;
}>`
  ${({ isFlex }) => isFlex && "display: flex;"}
  flex-direction: ${({ isLaptop }) => (isLaptop ? "column" : "row")};
  gap: ${rem(spacing.md)};
`;

export const Header = styled.div`
  flex-basis: 66%;
`;

const Title = styled.div<{
  isMobile: boolean;
}>`
  ${typography.Sans24}
  font-size: ${({ isMobile }) => (isMobile ? 24 : 34)}px;
  font-weight: 600;
  color: ${palette.pine2};
  margin-top: ${rem(spacing.lg)};
  margin-bottom: ${rem(spacing.md)};
`;

export const InfoSection = styled.div<{
  isMobile: boolean;
}>`
  display: flex;
  flex-wrap: wrap;
  column-gap: ${rem(spacing.xl)};
  row-gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.md)};
  margin-right: 0;
`;

const InfoItem = styled.div`
  color: ${palette.pine2};

  & span {
    color: ${palette.slate85};
  }
`;

const Description = styled.div`
  max-width: ${rem(700)};
  ${typography.Sans14};
  color: ${palette.slate85};
  margin-top: ${rem(spacing.md)};
`;

export const Subtitle = styled.div`
  ${typography.Sans24};
  color: ${palette.pine2};
  font-weight: 600;
  margin-top: 40px;
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  flex-basis: 60%;
  gap: ${rem(spacing.md)};
`;

export const Sidebar = styled.div<{
  isLaptop?: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex-basis: 40%;
  order: ${({ isLaptop }) => (isLaptop ? 0 : 1)};
  gap: ${rem(spacing.md)};
`;

const TooltipWrapper = styled.div`
  padding: ${rem(spacing.sm)};
`;

export const InsightsTooltip = ({
  contents,
  maxWidth,
  children,
}: {
  children: React.ReactElement;
  contents: ReactNode;
  maxWidth?: number;
}) => {
  return (
    <TooltipTrigger
      contents={contents && <TooltipWrapper>{contents}</TooltipWrapper>}
      maxWidth={maxWidth ?? 200}
      backgroundColor={palette.pine2}
    >
      {children}
    </TooltipTrigger>
  );
};

export const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
  width: 100%;
`;

type InsightsPageLayoutProps = {
  pageTitle?: string;
  infoItems?: {
    title: string;
    info: string | number | undefined | null | ReactNode;
    tooltip?: ReactNode;
  }[];
  pageSubtitle?: string;
  pageDescription?: ReactNode | string;
  descriptionHighlight?: string;
  contentsAboveTitle?: ReactNode;
  hasSupervisionInfoModal?: boolean;
  highlightedOfficers?: ReactNode;
  children?: ReactNode;
  isFlex?: boolean;
  limitedWidth?: boolean;
};

const InsightsPageLayout: React.FC<InsightsPageLayoutProps> = ({
  pageTitle,
  pageSubtitle,
  infoItems,
  pageDescription,
  contentsAboveTitle,
  hasSupervisionInfoModal,
  highlightedOfficers,
  children,
  isFlex,
  limitedWidth = true,
}) => {
  const { isMobile, isTablet, isLaptop } = useIsMobile(true);
  const [pageOpenedAt, setPageOpenedAt] = useState<Date>(new Date());

  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  useEffect(() => {
    setPageOpenedAt(new Date());
  }, []);

  if (!supervisionStore) return null;

  // trackPageViewed30Seconds every 30 seconds after the location updates
  if (pageOpenedAt.getTime() < now(THIRTY_SECONDS)) {
    supervisionStore.trackPageViewed30Seconds(location.pathname);
  }

  const { labels, methodologyUrl, exclusionReasonDescription } =
    supervisionStore;

  return (
    <PageWrapper isMobile={isTablet} $limitedWidth={limitedWidth}>
      {contentsAboveTitle}
      <Wrapper isFlex={isFlex} isLaptop={isLaptop}>
        <Header>
          {pageTitle && <Title isMobile={isMobile}>{pageTitle}</Title>}
          {infoItems && infoItems.length > 0 && (
            <InfoSection isMobile={isMobile}>
              {infoItems.map(
                (item) =>
                  !!item.info && (
                    <InsightsTooltip
                      key={item.title}
                      contents={item.tooltip}
                      maxWidth={235}
                    >
                      <InfoItem
                        data-intercom-target={
                          item.title === "staff" ? "Roster" : undefined
                        }
                      >
                        <span>{humanReadableTitleCase(item.title)}: </span>
                        {item.info}
                      </InfoItem>
                    </InsightsTooltip>
                  ),
              )}
            </InfoSection>
          )}
          {highlightedOfficers}
          {pageSubtitle && <Subtitle>{pageSubtitle}</Subtitle>}
          {pageDescription && <Description>{pageDescription}</Description>}
          {hasSupervisionInfoModal && (
            <InsightsInfoModal
              buttonText="Why aren't all my staff showing up?"
              title="Staff Lists"
              methodologyLink={methodologyUrl}
              copy={`We're listing all ${labels.supervisionOfficerLabel}s that we know to currently be reporting to this ${labels.supervisionSupervisorLabel} and that have caseload sizes within the ranges listed below.<br><br> 
              ${exclusionReasonDescription} <br><br>
              If an ${labels.supervisionOfficerLabel} is missing from this list or is incorrectly assigned to a ${labels.supervisionSupervisorLabel}, please let us know by messaging us via the support icon in the bottom right or by emailing **feedback@recidiviz.org.**`}
            />
          )}
          <InsightsActionStrategyModal />
        </Header>
      </Wrapper>
      {children}
    </PageWrapper>
  );
};

export default observer(InsightsPageLayout);
