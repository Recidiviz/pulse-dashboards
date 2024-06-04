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

import { observer } from "mobx-react-lite";
import moment from "moment";
import { useNavigate } from "react-router-dom";

import { Hydrator } from "~hydration-utils";

import { PSIStore } from "../../datastores/PSIStore";
import { StaffPresenter } from "../../presenters/StaffPresenter";
import { psiUrl } from "../../utils/routing";
import { ErrorMessage } from "../Error";
import * as Styled from "./Dashboard.styles";

const DashboardWithPresenter = observer(function DashboardWithPresenter({
  presenter,
}: {
  presenter: StaffPresenter;
}) {
  const navigate = useNavigate();
  const { staffPseudoId, listOfCaseBriefs } = presenter;

  if (!staffPseudoId || !listOfCaseBriefs) return null;

  const numberOfCasesDisplay = `${listOfCaseBriefs.length} ${listOfCaseBriefs.length === 1 ? "case" : "cases"}`;

  return (
    <Styled.PageContainer>
      {/* Welcome Message */}
      <Styled.WelcomeMessage>
        <Styled.WelcomeTitle>
          Welcome to your case dashboard
        </Styled.WelcomeTitle>
        <Styled.WelcomeDescription>
          Generate informed case recommendations based on historical outcomes
          customized for each case. Find and suggest customized treatment
          opportunities for detendants that will aid in their healing and
          integrating back into the community.
        </Styled.WelcomeDescription>
      </Styled.WelcomeMessage>

      {/* List of Cases */}
      <Styled.Cases>
        <Styled.SectionTitle>My Cases</Styled.SectionTitle>
        <Styled.SectionSubtitle>{numberOfCasesDisplay}</Styled.SectionSubtitle>
        <Styled.CaseListContainer>
          {listOfCaseBriefs.length > 0 ? (
            <Styled.CaseOverviewWrapper isHeader>
              <Styled.Cell>Name</Styled.Cell>
              <Styled.Cell>Report Type</Styled.Cell>
              <Styled.Cell>Offense</Styled.Cell>
              <Styled.Cell>Status</Styled.Cell>
              <Styled.Cell>Due Date</Styled.Cell>
              <Styled.Cell />
            </Styled.CaseOverviewWrapper>
          ) : (
            `No cases to review`
          )}
          {listOfCaseBriefs?.map((caseBrief) => (
            <Styled.CaseOverviewItem>
              <Styled.CaseOverviewWrapper>
                <Styled.Cell>{caseBrief.Client?.fullName}</Styled.Cell>
                <Styled.Cell>{caseBrief.reportType}</Styled.Cell>
                <Styled.Cell>
                  {caseBrief.primaryCharge}{" "}
                  {caseBrief.secondaryCharges.length > 0 &&
                    `(+${caseBrief.secondaryCharges.length} more)`}
                </Styled.Cell>
                <Styled.Cell>Not yet started</Styled.Cell>
                <Styled.Cell>
                  {moment(caseBrief.dueDate).format("MM-DD-YYYY")}
                </Styled.Cell>
                <Styled.Button
                  onClick={() =>
                    navigate(
                      psiUrl("caseDetails", {
                        staffPseudoId: staffPseudoId,
                        caseId: caseBrief.id,
                      }),
                    )
                  }
                >
                  Get Started
                </Styled.Button>
              </Styled.CaseOverviewWrapper>
            </Styled.CaseOverviewItem>
          ))}
        </Styled.CaseListContainer>
      </Styled.Cases>
    </Styled.PageContainer>
  );
});

export const Dashboard: React.FC<{
  psiStore: PSIStore;
}> = observer(function Dashboard({ psiStore }) {
  const { staffStore } = psiStore;

  const presenter = new StaffPresenter(staffStore);

  return (
    <Hydrator hydratable={presenter} failed={<ErrorMessage />}>
      <DashboardWithPresenter presenter={presenter} />
    </Hydrator>
  );
});
