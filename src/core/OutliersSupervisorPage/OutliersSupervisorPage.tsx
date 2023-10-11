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

import { palette } from "@recidiviz/design-system";
import { useParams } from "react-router-dom";
import simplur from "simplur";

import NotFound from "../../components/NotFound";
import useIsMobile from "../../hooks/useIsMobile";
import { supervisionOfficerFixture } from "../../OutliersStore/models/offlineFixtures/SupervisionOfficerFixture";
import { supervisionOfficerSupervisorsFixture } from "../../OutliersStore/models/offlineFixtures/SupervisionOfficerSupervisor";
import { OutliersStaffLegend } from "../OutliersLegend";
import OutliersPageLayout from "../OutliersPageLayout";
import {
  Body,
  Sidebar,
  Wrapper,
} from "../OutliersPageLayout/OutliersPageLayout";
import OutliersStaffCard from "./OutliersStaffCard";

const OutliersSupervisorPage = () => {
  const { isLaptop } = useIsMobile(true);
  const { supervisorId }: { supervisorId: string } = useParams();

  const supervisor = supervisionOfficerSupervisorsFixture.find(
    (s) => s.externalId === supervisorId
  );
  // TODO Remove local storage once data store is ready
  localStorage.setItem("supervisor", JSON.stringify(supervisor));

  const allOfficers =
    supervisionOfficerFixture.filter((s) => s.supervisorId === supervisorId) ||
    [];
  // TODO Remove local storage once data store is ready
  localStorage.setItem("officers", JSON.stringify(allOfficers));

  const outlierOfficers = allOfficers.filter(
    (officer) => officer.currentPeriodStatuses.FAR.length > 0
  );

  const pageTitle = simplur`${outlierOfficers.length} of the ${allOfficers.length} officer[|s] in your unit [is an|are] outlier[|s] on one or more metrics`;

  if (!supervisor) return <NotFound />;

  const infoItems = [
    { title: "district", info: supervisor.district },
    { title: "unit supervisor", info: supervisor.displayName },
    {
      title: "staff",
      info: allOfficers.map((officer) => officer.displayName).join(", "),
    },
  ];

  return (
    <OutliersPageLayout pageTitle={pageTitle} infoItems={infoItems}>
      <Wrapper isLaptop={isLaptop}>
        <Sidebar isLaptop={isLaptop}>
          <OutliersStaffLegend note="Correctional officers are only compared with other officers with similar caseloads. An officer with a specialized caseload will not be compared to one with a general caseload." />
        </Sidebar>
        <Body>
          {outlierOfficers.map((officer) => {
            return (
              <OutliersStaffCard key={officer.externalId} officer={officer}>
                <div style={{ height: 200, background: palette.slate10 }} />
              </OutliersStaffCard>
            );
          })}
        </Body>
      </Wrapper>
    </OutliersPageLayout>
  );
};

export default OutliersSupervisorPage;
