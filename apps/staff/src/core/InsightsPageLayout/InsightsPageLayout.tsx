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
import { rem } from "polished";
import { ReactNode } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { humanReadableTitleCase, pluralizeWord } from "../../utils";
import InsightsInfoModal from "../InsightsInfoModal";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.lg)};
`;

export const Wrapper = styled.div<{
  isLaptop: boolean;
}>`
  display: flex;
  flex-direction: ${({ isLaptop }) => (isLaptop ? "column" : "row")};
  gap: ${rem(spacing.md)};
`;

const Header = styled.div`
  flex-basis: 66%;
`;

const Title = styled.div<{
  isMobile: boolean;
}>`
  ${({ isMobile }) => (isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
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
}>`
  display: flex;
  flex-wrap: wrap;
  column-gap: ${rem(spacing.xl)};
  row-gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.md)};
  margin-right: ${({ isMobile }) => (isMobile ? 0 : 20)}%;
`;

const InfoItem = styled.div`
  color: ${palette.pine2};

  & span {
    color: ${palette.slate70};
  }
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  flex-basis: 66%;
  gap: ${rem(spacing.md)};
`;

export const Sidebar = styled.div<{
  isLaptop?: boolean;
}>`
  display: flex;
  flex-direction: column;
  flex-basis: 33%;
  order: ${({ isLaptop }) => (isLaptop ? 0 : 1)};
  gap: ${rem(spacing.md)};
`;

type InsightsPageLayoutProps = {
  pageTitle: string;
  infoItems: { title: string; info: string | undefined | null }[];
  contentsAboveTitle?: ReactNode;
  textToHighlight?: string;
  hasSupervisionInfoModal?: boolean;
  children?: ReactNode;
};

const InsightsPageLayout: React.FC<InsightsPageLayoutProps> = ({
  pageTitle,
  infoItems,
  contentsAboveTitle,
  hasSupervisionInfoModal,
  textToHighlight = "outlier",
  children,
}) => {
  const { isMobile, isLaptop } = useIsMobile(true);

  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore) return null;

  const { labels, methodologyUrl, exclusionReasonDescription } =
    supervisionStore;

  const hasHighlightedSubstring = pageTitle.includes(textToHighlight);
  const textToHighlightPlural = pluralizeWord(textToHighlight);
  const outlierSubstring = pageTitle.includes(textToHighlightPlural)
    ? textToHighlightPlural
    : textToHighlight;
  const [pageTitleStart, pageTitleEnd] = pageTitle.split(outlierSubstring);

  return (
    <PageWrapper>
      {contentsAboveTitle}
      <Wrapper isLaptop={isLaptop}>
        <Header>
          <Title isMobile={isMobile}>
            {pageTitleStart}
            {hasHighlightedSubstring && (
              <TooltipTrigger
                contents={`Outliers means the ${labels.supervisionOfficerLabel} has a rate over 1 Interquartile Range above the statewide rate.`}
                maxWidth={310}
              >
                <HighlightedText>{outlierSubstring}</HighlightedText>
              </TooltipTrigger>
            )}
            {pageTitleEnd}
          </Title>
          {infoItems.length > 0 && (
            <InfoSection isMobile={isMobile}>
              {infoItems.map(
                (item) =>
                  item.info && (
                    <InfoItem
                      key={item.title}
                      data-intercom-target={
                        item.title === "staff" ? "Roster" : undefined
                      }
                    >
                      <span>{humanReadableTitleCase(item.title)}: </span>
                      {item.info}
                    </InfoItem>
                  ),
              )}
            </InfoSection>
          )}
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
        </Header>
      </Wrapper>
      {children}
    </PageWrapper>
  );
};

export default InsightsPageLayout;