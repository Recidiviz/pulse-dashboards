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

import { observer } from "mobx-react-lite";
import { useState } from "react";
import simplur from "simplur";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficersPresenter } from "../../InsightsStore/presenters/SupervisionOfficersPresenter";
import { getDistrictWithoutLabel } from "../../InsightsStore/presenters/utils";
import { getWelcomeText } from "../../utils";
import InsightsEmptyPage from "../InsightsEmptyPage";
import { InsightsStaffLegend } from "../InsightsLegend";
import InsightsPageLayout from "../InsightsPageLayout";
import {
  Body,
  Sidebar,
  Wrapper,
} from "../InsightsPageLayout/InsightsPageLayout";
import ModelHydrator from "../ModelHydrator";
import { NavigationBackButton } from "../NavigationBackButton";
import { insightsUrl } from "../views";
import InsightsStaffCard from "./InsightsStaffCard";

export const SupervisorPage = observer(function SupervisorPage({
  presenter,
}: {
  presenter: SupervisionOfficersPresenter;
}) {
  const { isLaptop } = useIsMobile(true);
  const [initialPageLoad, setInitialPageLoad] = useState(true);

  const {
    supervisorInfo,
    outlierOfficersData,
    allOfficers,
    supervisorIsCurrentUser,
    userCanAccessAllSupervisors,
    timePeriod,
    labels,
  } = presenter;

  const emptyPageHeaderText = `${getWelcomeText(
    supervisorInfo?.fullName.givenNames,
    "Nice work",
  )}! None of the ${labels.supervisionOfficerLabel}s in your ${
    labels.supervisionUnitLabel
  } ${labels.noneAreOutliersLabel}.`;

  if (!outlierOfficersData || outlierOfficersData.length === 0)
    return (
      <InsightsEmptyPage
        headerText={emptyPageHeaderText}
        callToActionText={`Keep checking back – this page will update regularly to surface
outlier ${labels.supervisionOfficerLabel}s in your ${labels.supervisionUnitLabel}.`}
      />
    );

  const infoItems = [
    {
      title: labels.supervisionDistrictLabel,
      info: getDistrictWithoutLabel(
        supervisorInfo?.supervisionDistrict,
        labels.supervisionDistrictLabel,
      ),
    },
    {
      title: `${labels.supervisionUnitLabel} ${labels.supervisionSupervisorLabel}`,
      info: supervisorInfo?.displayName,
    },
    {
      title: "time period",
      info: timePeriod,
    },
    {
      title: "staff",
      info: allOfficers?.map((officer) => officer.displayName).join(", "),
    },
  ];

  const pageTitle = simplur`${outlierOfficersData.length} of the ${
    allOfficers?.length
  } ${labels.supervisionOfficerLabel}[|s] in ${
    supervisorIsCurrentUser ? "your" : `${supervisorInfo?.displayName}'s`
  } ${
    labels.supervisionUnitLabel
  } [is an|are] outlier[|s] on one or more metrics`;

  if (initialPageLoad) {
    presenter.trackViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={pageTitle}
      infoItems={infoItems}
      hasSupervisionInfoModal
      contentsAboveTitle={
        userCanAccessAllSupervisors && (
          <NavigationBackButton
            action={{ url: insightsUrl("supervisionSupervisorsList") }}
          >
            Go to {labels.supervisionSupervisorLabel}s list
          </NavigationBackButton>
        )
      }
    >
      <Wrapper isLaptop={isLaptop}>
        <Sidebar isLaptop={isLaptop}>
          <InsightsStaffLegend
            note={
              presenter.areCaseloadTypeBreakdownsEnabled
                ? `Correctional ${labels.supervisionOfficerLabel}s are only compared with other ${labels.supervisionOfficerLabel}s with similar caseloads. An ${labels.supervisionOfficerLabel} with a specialized caseload will not be compared to one with a general caseload.`
                : undefined
            }
          />
        </Sidebar>
        <Body>
          {outlierOfficersData.map((officer, officerIndex) => {
            return (
              <InsightsStaffCard
                key={officer.externalId}
                officer={officer}
                officerIndex={officerIndex}
                subtitle={
                  (presenter.areCaseloadTypeBreakdownsEnabled &&
                    officer.caseloadType) ||
                  undefined
                }
              />
            );
          })}
        </Body>
      </Wrapper>
    </InsightsPageLayout>
  );
});

const InsightsSupervisorPage = observer(function InsightsSupervisorPage() {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore?.supervisorPseudoId) return null;

  const presenter = new SupervisionOfficersPresenter(
    supervisionStore,
    supervisionStore.supervisorPseudoId,
  );

  return (
    <ModelHydrator model={presenter}>
      <SupervisorPage presenter={presenter} />
    </ModelHydrator>
  );
});

export default InsightsSupervisorPage;
