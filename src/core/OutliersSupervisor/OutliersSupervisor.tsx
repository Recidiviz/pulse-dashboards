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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { useParams } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { OutliersStaffLegend } from "../OutliersLegend";
import OutliersNavLayout from "../OutliersNavLayout";
import OutliersStaffCard from "./OutliersStaffCard";

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: ${rem(spacing.md)};
`;

const Header = styled.div<{
  isLaptop: boolean;
}>`
  grid-row: 1;
  grid-column: ${({ isLaptop }) => (isLaptop ? "1/13" : "1/9")};
`;

const Title = styled.div<{
  isMobile: boolean;
}>`
  ${({ isMobile }) => (isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const Body = styled.div<{
  isLaptop: boolean;
}>`
  grid-row: ${({ isLaptop }) => (isLaptop ? "3" : "2")};
  grid-column: ${({ isLaptop }) => (isLaptop ? "1/13" : "1/9")};
`;

const Sidebar = styled.div<{
  isLaptop: boolean;
}>`
  grid-row: 2;
  grid-column: ${({ isLaptop }) => (isLaptop ? "1/13" : "9/13")};
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

export const supervisors = [
  {
    id: "12345",
    name: "Supervisor One",
    locationId: "Harrisburg",
    officers: [
      {
        id: "23456",
        name: "Officer One",
        locationId: "Harrisburg",
        caseloadTypes: ["General Caseload", "Alcohol and Drug Caseload"],
        outliersMetrics: [
          {
            metricId: "incarceration_starts",
            metricName: "Incarcerations",
            rate: 0.5,
          },
          {
            metricId: "absconsions_starts",
            metricName: "Absconsions",
            rate: 0.4,
          },
        ],
      },
      {
        id: "34567",
        name: "Officer Two",
        locationId: "Harrisburg",
        caseloadTypes: ["General Caseload"],
        outliersMetrics: [
          {
            metricId: "incarceration_starts",
            metricName: "Incarcerations",
            rate: 0.3,
          },
        ],
      },
      {
        id: "45678",
        name: "Officer Three",
        locationId: "Harrisburg",
        outliersMetrics: [],
      },
      {
        id: "56789",
        name: "Officer Four",
        locationId: "Harrisburg",
        outliersMetrics: [],
      },
    ],
  },
  {
    id: "123456",
    name: "Supervisor Two",
    locationId: "Lebanon",
    officers: [
      {
        id: "56789",
        name: "Officer Four",
        locationId: "Lebanon",
        caseloadTypes: ["General Caseload"],
        outliersMetrics: [
          {
            metricId: "incarceration_starts",
            metricName: "Incarcerations",
            rate: 0.5,
          },
        ],
      },
    ],
  },
];

const OutliersSupervisor = () => {
  const { isMobile, isLaptop } = useIsMobile(true);
  const { supervisorId }: { supervisorId: string } = useParams();

  const supervisor = supervisors.find((s) => s.id === supervisorId);

  const officers =
    supervisors.find((s) => s.id === supervisorId)?.officers || [];

  const isOutliers = officers.filter(
    (officer) => officer.outliersMetrics.length > 0
  );

  const pageTitle = simplur`${isOutliers.length} of the ${officers.length} officer[|s] in your unit [is an|are] outlier[|s] on one or more metrics`;

  if (!supervisor) return <div />;

  return (
    <OutliersNavLayout>
      <Wrapper>
        <Header isLaptop={isLaptop}>
          <Title isMobile={isMobile}>{pageTitle}</Title>
          <InfoSection isMobile={isMobile}>
            <InfoItem>
              <span>District: </span> {supervisor?.locationId}
            </InfoItem>
            <InfoItem>
              <span>Unit Supervisor: </span> {supervisor?.name}
            </InfoItem>
            <InfoItem>
              <span>Staff: </span>
              {officers.map((officer) => officer.name).join(", ")}
            </InfoItem>
          </InfoSection>
        </Header>
        <Sidebar isLaptop={isLaptop}>
          <OutliersStaffLegend note="Correctional officers are only compared with other officers with similar caseloads. An officer with a specialized caseload will not be compared to one with a general caseload." />
        </Sidebar>
        <Body isLaptop={isLaptop}>
          {isOutliers.map((officer: any) => {
            return (
              <OutliersStaffCard key={officer.id} officer={officer}>
                <div style={{ height: 200, background: palette.slate10 }} />
              </OutliersStaffCard>
            );
          })}
        </Body>
      </Wrapper>
    </OutliersNavLayout>
  );
};

export default OutliersSupervisor;
