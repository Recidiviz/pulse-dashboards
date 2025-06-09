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

import {
  Button,
  Loading,
  spacing,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import MarkdownView from "react-showdown";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import Checkbox from "../../components/Checkbox";
import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { UserOnboardingPresenter } from "../../InsightsStore/presenters/UserOnboardingPresenter";
import ModelHydrator from "../ModelHydrator";
import { NAV_BAR_HEIGHT, NavigationLayout } from "../NavigationLayout";
import { insightsUrl } from "../views";
import OnboardingFaq from "./OnboardingFaq";
import OnboardingFeatures from "./OnboardingFeatures";
import OutliersStaff, { TooltipContentWrapper } from "./OutliersStaff";
import ProgressBar, { PROGRESS_BAR_HEIGHT } from "./ProgressBar";

const ROSTER_TAB_ID = "rosterTab";
const CHECKBOX_TAB_ID = "checkboxTab";
const LOADING_TAB_ID = "loadingTab";

const Wrapper = styled.div<{ isMobile: boolean }>`
  min-height: calc(100vh - ${rem(NAV_BAR_HEIGHT + PROGRESS_BAR_HEIGHT)});
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${rem(spacing.md)};

  h1,
  h2 {
    ${({ isMobile }) => isMobile && `font-size: ${rem(24)} !important`}
  }
  p {
    ${({ isMobile }) => isMobile && `font-size: ${rem(18)} !important`}
  }
`;

const Content = styled.div`
  max-width: ${rem(555)};
  text-align: center;
`;

const Tab = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const H1 = styled.h1`
  ${typography.Serif34}
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const H2 = styled.h2`
  ${typography.Sans24}
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.lg)};
`;

const StyledMarkdownView = styled(MarkdownView)`
  p {
    ${typography.Sans24};
    color: ${palette.slate85};
    line-height: ${rem(spacing.xl)};
    margin-bottom: ${rem(spacing.lg)};
  }

  strong {
    font-weight: normal;
    color: ${palette.pine2};
  }

  em {
    font-style: normal;
    color: ${palette.signal.error};
  }
`;

const Extra = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: ${rem(spacing.lg)};

  .Checkbox {
    &__container {
      height: inherit;
      width: inherit;
      margin: 0;
    }
    &__label {
      top: -1px;
      ${typography.Sans16};
    }
    &__box {
      border-radius: ${rem(spacing.xs)};
    }
  }
`;

const Buttons = styled.div`
  display: flex;
  justify-content: center;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.xl)} 0;
`;

const StyledButton = styled(Button).attrs({ shape: "block" })`
  padding: ${rem(spacing.md)} ${rem(spacing.xxl)};
`;

const OnboardingPage = observer(function OnboardingPage({
  presenter,
}: {
  presenter: UserOnboardingPresenter;
}) {
  const navigate = useNavigate();
  const { isMobile } = useIsMobile(true);
  const { insightsOnboarding } = useFeatureVariants();
  const [currentTabIndex, setTabIndex] = useState(0);
  const [isAgreementChecked, setChecked] = useState(false);

  const {
    setUserHasSeenOnboarding,
    userHasSeenOnboarding,
    userName,
    userPseudoId,
    labels,
    eventLabels,
    isRecidivizUser,
    isWorkflowsHomepageEnabled,
    tenantId,
    isInsightsLanternState,
  } = presenter;

  const tabs = [
    {
      id: "welcomeTab",
      h1: `Welcome, ${userName}`,
      description: `Press ‘next’ to continue.`,
    },
    {
      id: "descriptionTab",
      description: `This **new update** will show you which staff members may need additional support with their caseload.
      
${isWorkflowsHomepageEnabled ? "You'll see more information on outlier metrics and a team-level view of clients eligible for opportunities" : ""}`,
    },
    {
      id: "rosterTab",
      description: `We've preloaded your team roster:`,
      extra: <OutliersStaff supervisorPseudoId={userPseudoId} />,
    },
    {
      id: "goalTab",
      description: `Our goal is to help you have more **meaningful conversations** with your staff.`,
    },
    {
      id: "explainTab",
      description: `Evidence suggests that **good rapport** with clients can reduce violations and improve outcomes.
      
Reducing potential **cases of over-supervision** can give your officers more time to focus on building rapport and supporting clients.`,
    },
    {
      id: "checkboxTab",
      h2: "Important: Please Confirm",
      description: `Using this tool as a “gotcha” to penalize your staff creates an *unhealthy* work environment.`,
      extra: (
        <Checkbox
          value="I will use this tool ethically and treat my staff fairly"
          checked={isAgreementChecked}
          onChange={() => setChecked(!isAgreementChecked)}
        >
          I will use this tool ethically and treat my staff fairly
        </Checkbox>
      ),
    },
    {
      id: "loadingTab",
      description: `Thank you. Here are the features we have in store...`,
      extra: <Loading message="Loading" />,
    },
    {
      id: "getStartedTab",
      h2: "Ready to jump in?",
      description: `Over time we will continue to add more features. Reach out to us with ideas!`,
    },
  ];

  const filteredTabs = tabs.filter((tab) =>
    tab.id === ROSTER_TAB_ID && !userPseudoId ? null : tab,
  );

  const currentTab = filteredTabs[currentTabIndex];
  const totalTabs = filteredTabs.length;
  const progressPercent = ((currentTabIndex + 1) / (totalTabs - 1)) * 100;
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex + 1 === totalTabs;
  const isCheckboxTab = currentTab.id === CHECKBOX_TAB_ID;
  const isLoadingTab = currentTab.id === LOADING_TAB_ID;

  useEffect(() => {
    if (isLoadingTab) {
      setTimeout(() => {
        setTabIndex((prevState) => prevState + 1);
      }, 3000);
    }
  }, [isLoadingTab]);

  const handleNextButtonClick = async () => {
    if (!isLoadingTab && !isLastTab) {
      setTabIndex((prevState) => prevState + 1);
    }

    if (isLastTab) {
      await setUserHasSeenOnboarding(true);
      navigate(insightsUrl("supervision"));
    }
  };

  const handleBackButtonClick = () => {
    setTabIndex((prevState) => prevState - 1);
  };

  if (!insightsOnboarding || (!isRecidivizUser && userHasSeenOnboarding)) {
    return <Navigate replace to={insightsUrl("supervision")} />;
  }

  return (
    <>
      {!isLastTab && <ProgressBar percent={progressPercent} />}
      <NavigationLayout isNaked isFixed={false} />
      <Wrapper isMobile={isMobile}>
        <Tab>
          {isLastTab && (
            <OnboardingFeatures
              labels={labels}
              eventLabels={eventLabels}
              tenantId={tenantId}
              isWorkflowsHomepageEnabled={isWorkflowsHomepageEnabled}
              isInsightsLanternState={isInsightsLanternState}
            />
          )}
          <Content>
            {currentTab.h1 && <H1>{currentTab.h1}</H1>}
            {currentTab.h2 && <H2>{currentTab.h2}</H2>}
            <StyledMarkdownView
              markdown={currentTab.description}
              options={{ simpleLineBreaks: true }}
            />
            {currentTab.extra && <Extra>{currentTab.extra}</Extra>}
            {!isLoadingTab && (
              <Buttons>
                {!isFirstTab && !isLastTab && (
                  <StyledButton
                    kind="secondary"
                    onClick={handleBackButtonClick}
                  >
                    Back
                  </StyledButton>
                )}
                <TooltipTrigger
                  contents={
                    isCheckboxTab &&
                    !isAgreementChecked && (
                      <TooltipContentWrapper>
                        To proceed, click the checkbox above.
                      </TooltipContentWrapper>
                    )
                  }
                >
                  <StyledButton
                    disabled={isCheckboxTab && !isAgreementChecked}
                    onClick={handleNextButtonClick}
                  >
                    {isLastTab ? "Get started" : "Next"}
                  </StyledButton>
                </TooltipTrigger>
              </Buttons>
            )}
          </Content>
        </Tab>
      </Wrapper>
      {isLastTab && <OnboardingFaq labels={labels} eventLabels={eventLabels} />}
    </>
  );
});

const InsightsOnboardingPage = observer(function InsightsOnboardingPage() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore) return null;

  const presenter = new UserOnboardingPresenter(supervisionStore);

  return (
    <ModelHydrator hydratable={presenter}>
      <OnboardingPage presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsOnboardingPage;
