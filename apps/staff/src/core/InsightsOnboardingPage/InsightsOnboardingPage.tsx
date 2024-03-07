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

import { Button, palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import outliersDataPreview from "../../assets/static/images/outliersDataPreview.png";
import outliersRatePreview from "../../assets/static/images/outliersRatePreview.png";
import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { UserOnboardingPresenter } from "../../InsightsStore/presenters/UserOnboardingPresenter";
import { toTitleCase } from "../../utils";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import ProgressBar from "./ProgressBar";

const Wrapper = styled.div<{ isLaptop: boolean; isMobile: boolean }>`
  padding: ${({ isLaptop }) => (isLaptop ? "16px" : "48px 88px")};
  ${({ isMobile }) => isMobile && `padding: unset`}
`;

const Content = styled.div`
  max-width: 700px;
`;

const Tab = styled.div<{
  isTablet: boolean;
  isTwoColumn: boolean;
}>`
  height: 70vh;
  display: ${({ isTablet }) => (isTablet ? "block" : "grid")};
  grid-template-columns: ${({ isTwoColumn }) =>
    isTwoColumn ? "1fr 1fr" : "unset"};
  align-items: center;
  justify-content: center;
  padding: 0;
  padding-top: ${rem(spacing.xxl)};

  ${Wrapper} {
    ${({ isTwoColumn }) => isTwoColumn && "max-width: 500px;"}
  }
`;

const Title = styled.div<{
  isLaptop: boolean;
}>`
  ${({ isLaptop }) => (isLaptop ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  padding-bottom: ${({ isLaptop }) =>
    isLaptop ? rem(spacing.xl) : rem(spacing.lg)};
`;

const StyledMarkdownView = styled(MarkdownView)<{ $isLaptop: boolean }>`
  p {
    ${typography.Sans18};
    color: ${palette.slate85};
    line-height: ${rem(spacing.xl)};
    padding-bottom: ${rem(spacing.xl)};
    margin: 0;
  }

  h1 {
    ${({ $isLaptop }) => ($isLaptop ? typography.Serif24 : typography.Serif34)}
    color: ${palette.pine2};
    padding-bottom: ${rem(spacing.xl)};
    margin: 0;
  }

  strong {
    font-weight: normal;
    color: ${palette.pine1};
  }
`;

const StyledButton = styled(Button).attrs({ shape: "block" })`
  padding: ${rem(spacing.md)} ${rem(spacing.xxl)};
  margin: ${rem(spacing.lg)} 0;
`;

const Image = styled.div`
  display: grid;
  justify-content: center;
`;

const OnboardingPage = observer(function OnboardingPage({
  presenter,
}: {
  presenter: UserOnboardingPresenter;
}) {
  const navigate = useNavigate();
  const { isMobile, isTablet, isLaptop } = useIsMobile(true);
  const { insightsOnboarding } = useFeatureVariants();
  const [currentTabIndex, setTabIndex] = useState(0);

  const { setUserHasSeenOnboarding, labels } = presenter;

  if (!insightsOnboarding) {
    return <Navigate replace to={insightsUrl("supervision")} />;
  }

  const onboardingTabs = [
    {
      title: "Introducing Recidiviz Insights",
      description: [
        `This coaching tool **highlights ${labels.supervisionOfficerLabel}s who may need support** with managing their caseload and helping their ${labels.supervisionJiiLabel}s succeed.`,
        `Although ${labels.supervisionOfficerLabel}s don’t have direct control over their ${labels.supervisionJiiLabel}’s decisions, **their approach does affect their ${labels.supervisionJiiLabel}’s success**. Evidence suggests that good rapport can reduce absconsions, and **program and treatment referrals** can prevent violations that lead to incarceration.`,
      ],
    },
    {
      title: "What does this tool include?",
      description: [
        `This tool highlights **“outlier” ${labels.supervisionOfficerLabel}s** whose incarceration, technical incarceration and/or absconsion rates are **significantly higher than the statewide rate**.`,
        "It also provides additional detail – like **over-time trends and case-level drill-downs** – to enable a productive coaching conversation.",
      ],
      image: outliersDataPreview,
    },
    {
      title: "How is this tool meant to be used?",
      description: [
        `This tool is meant to enable more of **“coach” as opposed to a “referee” approach** to managing your team. It isn’t meant to be a “gotcha” to penalize your staff. Instead, it’s **an opportunity to learn more and start a conversation** with ${labels.supervisionOfficerLabel}s who may need extra support.`,
      ],
    },
    {
      title: "What is an “outlier”?",
      description: [
        `An outlier ${labels.supervisionOfficerLabel} has an annual incarceration, technical incarceration or absconsion rate that is over 1 interquartile range higher than the statewide rate. That means that **the ${labels.supervisionOfficerLabel}’s rate is much higher than the other ${labels.supervisionOfficerLabel}s in the state**.`,
      ],
      image: outliersRatePreview,
    },
    {
      title: "Which metrics are shown in this tool?",
      description: [
        "This tool shows three rates: Incarceration rate, Technical Incarceration rate and Absconsion rate. Definitions of how these rates are calculated are available in detail within the tool.",
        "The tool includes more detail about how those rates are calculated.",
      ],
    },
    {
      title: "Who has access to this tool?",
      description: [
        `${toTitleCase(
          labels.supervisionSupervisorLabel,
        )}s, district and regional management, and DOC administrators have access to this tool. ${toTitleCase(
          labels.supervisionOfficerLabel,
        )}s do not have access.`,
        "# If you have questions, we’re here to help.",
        "Click on the chat button in the bottom right corner of the screen to ask a question or send us feedback anytime.",
      ],
    },
  ];

  const currentTab = onboardingTabs[currentTabIndex];
  const totalTabs = onboardingTabs.length;
  const progressPercent = ((currentTabIndex + 1) / totalTabs) * 100;
  const isLastTab = currentTabIndex + 1 === totalTabs;

  const handleButtonClick = async () => {
    if (!isLastTab) {
      setTabIndex((prevState) => prevState + 1);
    } else {
      await setUserHasSeenOnboarding(true);
      navigate(insightsUrl("supervision"));
    }
  };

  return (
    <Wrapper isLaptop={isLaptop} isMobile={isMobile}>
      <ProgressBar percent={progressPercent} />
      <Tab isTablet={isTablet} isTwoColumn={!!currentTab.image}>
        <Content>
          <Title isLaptop={isLaptop}>{currentTab.title}</Title>
          {currentTab.description.map((d) => (
            <StyledMarkdownView
              key={d}
              $isLaptop={isLaptop}
              markdown={d}
              options={{ simpleLineBreaks: true }}
            />
          ))}
          <StyledButton onClick={handleButtonClick}>
            {isLastTab ? "Get started" : "Next"}
          </StyledButton>
        </Content>
        {!!currentTab.image && (
          <Image>
            <img src={currentTab.image} alt={currentTab.title} />
          </Image>
        )}
      </Tab>
    </Wrapper>
  );
});

const InsightsOnboardingPage = observer(function InsightsOnboardingPage() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore) return null;

  const presenter = new UserOnboardingPresenter(supervisionStore);

  return (
    <ModelHydrator model={presenter}>
      <OnboardingPage presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsOnboardingPage;
