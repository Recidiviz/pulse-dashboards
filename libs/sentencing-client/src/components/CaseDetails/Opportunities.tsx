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

import magnifyingGlassIcon from "../assets/magnifying-class-icon.png";
import verifiedIcon from "../assets/verified-icon.svg";
import warningTriangleIcon from "../assets/warning-triangle-icon.svg";
import { DropdownButton } from "../Dashboard/Dashboard.styles";
import * as Styled from "./CaseDetails.styles";

type OpportunitiesProps = {
  firstName?: string;
  isTermRecommendation: boolean;
};

// TODO(Recidiviz/recidiviz-data#30650) Implement Opportunities flow
export const Opportunities: React.FC<OpportunitiesProps> = ({
  firstName,
  isTermRecommendation,
}) => {
  const tempNeedsList = ["Need 1", "Need 2", "Need 3"].map((need) => (
    <div key={need}>{need}</div>
  ));

  return (
    <Styled.Opportunities>
      <Styled.Title>
        Opportunities for {firstName} <Styled.InfoIcon />{" "}
        <Styled.Chip color="green">1 Added to Recommendation</Styled.Chip>
      </Styled.Title>
      <Styled.Description>
        The following opportunities are available to Joshua based on the details
        of his case and personal information. Explore and add any opportunities
        that would set Joshua up for success on probation.
      </Styled.Description>
      <Styled.OpportunitiesTableWrapper>
        <Styled.SearchFilter>
          <Styled.Search>
            <img src={magnifyingGlassIcon} alt="" width="16px" />
            Search
          </Styled.Search>
          <Styled.Filter>
            <DropdownButton>District</DropdownButton>
            <DropdownButton>Needs Addressed</DropdownButton>
            <DropdownButton>Eligibility Criteria</DropdownButton>
          </Styled.Filter>
        </Styled.SearchFilter>
        <Styled.Caption>28 opportunities found</Styled.Caption>

        <Styled.OpportunitiesTable>
          {isTermRecommendation && (
            <Styled.OpportunitiesNotAvailable>
              <img src={warningTriangleIcon} alt="" />
              Community opportunities are not available for Term participants
            </Styled.OpportunitiesNotAvailable>
          )}
          <Styled.TableWrapper disabled={isTermRecommendation}>
            <Styled.Table>
              <thead>
                <tr>
                  <Styled.HeaderCell>Opportunity & Provider</Styled.HeaderCell>
                  <Styled.HeaderCell>Needs Addressed</Styled.HeaderCell>
                  <Styled.HeaderCell />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Styled.Cell>
                    District 2 Connection & Intervention Station - IDOC
                  </Styled.Cell>
                  <Styled.Cell>{tempNeedsList}</Styled.Cell>
                  <Styled.Cell>
                    <Styled.AddRecommendationButton>
                      Add to Recommendation
                    </Styled.AddRecommendationButton>
                  </Styled.Cell>
                </tr>
                <tr>
                  <Styled.Cell>
                    District 2 Connection & Intervention Station - IDOC
                  </Styled.Cell>
                  <Styled.Cell>{tempNeedsList}</Styled.Cell>
                  <Styled.Cell>
                    <Styled.AddRecommendationButton isAdded>
                      <img src={verifiedIcon} alt="" />
                      Added
                    </Styled.AddRecommendationButton>
                  </Styled.Cell>
                </tr>
              </tbody>
            </Styled.Table>
            <Styled.ViewMore>View More</Styled.ViewMore>
          </Styled.TableWrapper>
        </Styled.OpportunitiesTable>
      </Styled.OpportunitiesTableWrapper>
    </Styled.Opportunities>
  );
};
