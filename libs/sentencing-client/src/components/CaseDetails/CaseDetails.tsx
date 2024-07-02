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
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Hydrator } from "~hydration-utils";

import { PSIStore } from "../../datastores/PSIStore";
import { CaseDetailsPresenter } from "../../presenters/CaseDetailsPresenter";
import { psiUrl } from "../../utils/routing";
import { ErrorMessage } from "../Error";
import { CaseAttributes } from "./CaseAttributes";
import * as Styled from "./CaseDetails.styles";
import { Insights } from "./Insights";
import { Opportunities } from "./Opportunities";
import { Recommendations } from "./Recommendations";
import { RecommendationType } from "./types";

const CaseDetailsWithPresenter = observer(function CaseDetailsWithPresenter({
  presenter,
}: {
  presenter: CaseDetailsPresenter;
}) {
  const navigate = useNavigate();
  const { staffPseudoId, caseAttributes, form } = presenter;

  const [selectedRecommendation, setSelectedRecommendation] =
    useState<RecommendationType>();

  const updateRecommendation = (recommendation: RecommendationType) =>
    setSelectedRecommendation((prev) =>
      prev !== recommendation ? recommendation : undefined,
    );

  if (!staffPseudoId) {
    return <Styled.PageContainer>No staff ID found.</Styled.PageContainer>;
  }

  return (
    <Styled.PageContainer>
      <Styled.BackLink
        onClick={() =>
          navigate(
            psiUrl("dashboard", {
              staffPseudoId,
            }),
          )
        }
      >{`Back to Dashboard`}</Styled.BackLink>
      {/* Case Attributes */}
      <CaseAttributes caseAttributes={caseAttributes} form={form} />
      <Styled.Body>
        {/* Recommendations */}
        <Recommendations
          selectedRecommendation={selectedRecommendation}
          updateRecommendation={updateRecommendation}
        />
        <Styled.InsightsOpportunitiesWrapper>
          {/* Insights */}
          <Insights />
          {/* Opportunities */}
          <Opportunities
            isTermRecommendation={
              selectedRecommendation === RecommendationType.Term
            }
          />
        </Styled.InsightsOpportunitiesWrapper>
      </Styled.Body>
    </Styled.PageContainer>
  );
});

export const CaseDetails: React.FC<{
  psiStore: PSIStore;
}> = observer(function CaseDetails({ psiStore }) {
  const { caseStore } = psiStore;
  const params = useParams();

  if (!params["caseId"]) {
    return <Styled.PageContainer>No case ID found.</Styled.PageContainer>;
  }

  const presenter = new CaseDetailsPresenter(caseStore, params["caseId"]);

  return (
    <Hydrator hydratable={presenter} failed={<ErrorMessage />}>
      <CaseDetailsWithPresenter presenter={presenter} />
    </Hydrator>
  );
});
