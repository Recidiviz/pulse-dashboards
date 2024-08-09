// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  palette,
  spacing,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { now } from "mobx-utils";
import { rem } from "polished";
import { ReactNode, useEffect, useState } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { THIRTY_SECONDS } from "../../InsightsStore/presenters/utils";
import { humanReadableTitleCase, pluralizeWord } from "../../utils";
import InsightsInfoModal from "../InsightsInfoModal";

const PageWrapper = styled.div<{
  isMobile: boolean;
  supervisorHomepage: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: 0
    ${({ isMobile, supervisorHomepage }) =>
      !isMobile && supervisorHomepage ? "56px" : "0"};

  ${({ supervisorHomepage }) =>
    supervisorHomepage &&
    `max-width: ${rem(1200)};
    margin: 0 auto;`}
`;

export const Wrapper = styled.div<{
  isLaptop: boolean;
  supervisorHomepage?: boolean;
}>`
  display: ${({ supervisorHomepage }) =>
    supervisorHomepage ? "block" : "flex"};
  flex-direction: ${({ isLaptop }) => (isLaptop ? "column" : "row")};
  gap: ${rem(spacing.md)};
`;

const Header = styled.div`
  flex-basis: 66%;
`;

const Title = styled.div<{
  isMobile: boolean;
  supervisorHomepage: boolean;
}>`
  ${({ supervisorHomepage }) =>
    supervisorHomepage ? typography.Sans24 : typography.Serif34}
  font-size: ${({ isMobile }) => (isMobile ? 24 : 34)}px;
  font-weight: ${({ supervisorHomepage }) => (supervisorHomepage ? 600 : 400)};
  color: ${palette.pine2};
  margin-top: ${({ supervisorHomepage }) =>
    supervisorHomepage ? rem(spacing.lg) : 0};
  margin-bottom: ${rem(spacing.md)};
`;

const HighlightedText = styled.span`
  border-bottom: 2px dashed ${palette.pine2};
  &:hover {
    cursor: default;
  }
`;

const InfoSection = styled.div<{
  isMobile: boolean;
  supervisorHomepage: boolean;
}>`
  display: flex;
  flex-wrap: wrap;
  column-gap: ${rem(spacing.xl)};
  row-gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.md)};
  margin-right: ${({ isMobile, supervisorHomepage }) =>
    isMobile || supervisorHomepage ? 0 : 20}%;
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

export const Body = styled.div<{ supervisorHomepage?: boolean }>`
  display: flex;
  flex-direction: column;
  flex-basis: ${({ supervisorHomepage }) =>
    supervisorHomepage ? `60%;` : "66%;"};
  gap: ${rem(spacing.md)};
`;

export const Sidebar = styled.div<{
  isLaptop?: boolean;
  supervisorHomepage?: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex-basis: ${({ supervisorHomepage }) =>
    supervisorHomepage ? "40%;" : "33%;"};
  order: ${({ isLaptop }) => (isLaptop ? 0 : 1)};
  gap: ${rem(spacing.md)};
`;

const TooltipWrapper = styled.div`
  padding: ${rem(spacing.sm)};
`;

const TitleContents = ({
  pageTitle,
  supervisorHomepage,
  textToHighlight,
  tooltipContents,
}: {
  pageTitle: string;
  supervisorHomepage: boolean;
  textToHighlight: string;
  tooltipContents: string;
}) => {
  const hasHighlightedSubstring = pageTitle.includes(textToHighlight);
  const textToHighlightPlural = pluralizeWord(textToHighlight);
  const outlierSubstring = pageTitle.includes(textToHighlightPlural)
    ? textToHighlightPlural
    : textToHighlight;
  const [pageTitleStart, pageTitleEnd] = pageTitle.split(outlierSubstring);
  return supervisorHomepage ? (
    pageTitle
  ) : (
    <>
      {pageTitleStart}
      {hasHighlightedSubstring && (
        <InsightsTooltip contents={`${tooltipContents}`} maxWidth={310}>
          <HighlightedText>{outlierSubstring}</HighlightedText>
        </InsightsTooltip>
      )}
      {pageTitleEnd}
    </>
  );
};

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

type InsightsPageLayoutProps = {
  pageTitle?: string;
  infoItems?: {
    title: string;
    info: string | number | undefined | null;
    tooltip?: ReactNode;
  }[];
  pageSubtitle?: string;
  pageDescription?: ReactNode | string;
  descriptionHighlight?: string;
  contentsAboveTitle?: ReactNode;
  textToHighlight?: string;
  hasSupervisionInfoModal?: boolean;
  children?: ReactNode;
};

const InsightsPageLayout: React.FC<InsightsPageLayoutProps> = ({
  pageTitle,
  pageSubtitle,
  infoItems,
  pageDescription,
  contentsAboveTitle,
  hasSupervisionInfoModal,
  textToHighlight = "outlier",
  children,
}) => {
  const { isMobile, isTablet, isLaptop } = useIsMobile(true);
  const [pageOpenedAt, setPageOpenedAt] = useState<Date>(new Date());

  const {
    insightsStore: {
      supervisionStore,
      shouldUseSupervisorHomepageUI: supervisorHomepage,
    },
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
    <PageWrapper isMobile={isTablet} supervisorHomepage={supervisorHomepage}>
      {contentsAboveTitle}
      <Wrapper isLaptop={isLaptop} supervisorHomepage={supervisorHomepage}>
        <Header>
          {pageTitle && (
            <Title isMobile={isMobile} supervisorHomepage={supervisorHomepage}>
              <TitleContents
                pageTitle={pageTitle}
                supervisorHomepage={supervisorHomepage}
                textToHighlight={textToHighlight}
                tooltipContents={labels.outliersHover}
              />
            </Title>
          )}
          {infoItems && infoItems.length > 0 && (
            <InfoSection
              isMobile={isMobile}
              supervisorHomepage={supervisorHomepage}
            >
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
          {supervisorHomepage && pageSubtitle && (
            <Subtitle>{pageSubtitle}</Subtitle>
          )}
          {supervisorHomepage && pageDescription && (
            <Description>{pageDescription}</Description>
          )}
          {hasSupervisionInfoModal && (
            <InsightsInfoModal
              buttonText="Why aren't all my staff showing up?"
              title="Staff Lists"
              methodologyLink={methodologyUrl}
              copy={`We're listing all ${labels.supervisionOfficerLabel}s that we know to currently be reporting to this ${labels.supervisionSupervisorLabel} and that have caseload sizes within the ranges listed below.<br><br> 
              ${exclusionReasonDescription} <br><br>
              If an ${labels.supervisionOfficerLabel} is missing from this list or is incorrectly assigned to a ${labels.supervisionSupervisorLabel}, please let us know by messaging us via the support icon in the bottom right or by emailing **feedback@recidiviz.org.**`}
              supervisorHomepage={supervisorHomepage}
            />
          )}
        </Header>
      </Wrapper>
      {children}
    </PageWrapper>
  );
};

export default observer(InsightsPageLayout);
