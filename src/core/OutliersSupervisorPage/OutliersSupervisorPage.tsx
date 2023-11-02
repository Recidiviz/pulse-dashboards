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
import simplur from "simplur";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { SupervisionOfficersPresenter } from "../../OutliersStore/presenters/SupervisionOfficersPresenter";
import { getWelcomeText } from "../../utils";
import ModelHydrator from "../ModelHydrator";
import { NavigationBackButton } from "../NavigationBackButton";
import OutliersEmptyPage from "../OutliersEmptyPage";
import { OutliersStaffLegend } from "../OutliersLegend";
import OutliersPageLayout from "../OutliersPageLayout";
import {
  Body,
  Sidebar,
  Wrapper,
} from "../OutliersPageLayout/OutliersPageLayout";
import { outliersUrl } from "../views";
import OutliersStaffCard from "./OutliersStaffCard";

export const SupervisorPage = observer(function SupervisorPage({
  presenter,
}: {
  presenter: SupervisionOfficersPresenter;
}) {
  const { isLaptop } = useIsMobile(true);

  const {
    supervisorInfo,
    outlierOfficersData,
    allOfficers,
    supervisorIsCurrentUser,
  } = presenter;

  const emptyPageHeaderText = `${getWelcomeText(
    supervisorInfo?.fullName.givenNames,
    "Nice work"
  )}! None of the officers in your unit are currently
outliers on any metrics.`;

  if (!outlierOfficersData || outlierOfficersData.length === 0)
    return (
      <OutliersEmptyPage
        headerText={emptyPageHeaderText}
        callToActionText="Keep checking back – this page will update regularly to surface
outlier officers in your unit."
      />
    );

  const infoItems = [
    { title: "district", info: supervisorInfo?.supervisionDistrict },
    {
      title: "unit supervisor",
      info: supervisorInfo?.displayName,
    },
    {
      title: "staff",
      info: allOfficers?.map((officer) => officer.displayName).join(", "),
    },
  ];

  const pageTitle = simplur`${outlierOfficersData.length} of the ${allOfficers?.length} officer[|s] in your unit [is an|are] outlier[|s] on one or more metrics`;

  return (
    <OutliersPageLayout
      pageTitle={pageTitle}
      infoItems={infoItems}
      contentsAboveTitle={
        !supervisorIsCurrentUser && (
          <NavigationBackButton
            action={{ url: outliersUrl("supervisionSupervisorsList") }}
          >
            Go to supervisors list
          </NavigationBackButton>
        )
      }
    >
      <Wrapper isLaptop={isLaptop}>
        <Sidebar isLaptop={isLaptop}>
          <OutliersStaffLegend note="Correctional officers are only compared with other officers with similar caseloads. An officer with a specialized caseload will not be compared to one with a general caseload." />
        </Sidebar>
        <Body>
          {outlierOfficersData.map((officer) => {
            return (
              <OutliersStaffCard key={officer.externalId} officer={officer} />
            );
          })}
        </Body>
      </Wrapper>
    </OutliersPageLayout>
  );
});

const OutliersSupervisorPage = observer(function OutliersSupervisorPage() {
  const {
    outliersStore: { supervisionStore },
  } = useRootStore();

  if (!supervisionStore?.supervisorPseudoId) return null;

  const presenter = new SupervisionOfficersPresenter(
    supervisionStore,
    supervisionStore.supervisorPseudoId
  );

  return (
    <ModelHydrator model={presenter}>
      <SupervisorPage presenter={presenter} />
    </ModelHydrator>
  );
});

export default OutliersSupervisorPage;
