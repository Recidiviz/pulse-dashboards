// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import React, { useEffect, useRef } from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { OffenderAssessmentSubsection } from "../SARDetails/constants";
import { SectionContainer } from "../SARDetails/SARDetails.styles";
import { RiskLevelKey } from "./constants";
import { DomainCard } from "./DomainCard";
import * as DomainCardStyled from "./DomainCard.styles";
import { EmploymentHistoryCard } from "./EmploymentHistory";
import {
  BooleanDropdown,
  EducationDropdown,
  TextField,
} from "./FormComponents";
import * as Styled from "./OffenderAssessment.styles";
import { OrasAssessmentScoreCard } from "./OrasAssessmentScoreCard";
import { RiskCategorySummary } from "./RiskCategorySummary";
import { DrugHistoryCard } from "./SubstanceUse";
import { getDomainsForAssessmentType, ORASDomainKey } from "./utils";

interface OffenderAssessmentProps {
  presenter: SARDetailsPresenter;
  currentSubsection?: string;
}

export const OffenderAssessment: React.FC<OffenderAssessmentProps> = observer(
  ({ presenter, currentSubsection }) => {
    // Create refs for scroll-to behavior
    const criminalHistoryRef = useRef<HTMLDivElement>(null);
    const educationRef = useRef<HTMLDivElement>(null);
    const familyRef = useRef<HTMLDivElement>(null);
    const neighborhoodRef = useRef<HTMLDivElement>(null);
    const substanceUseRef = useRef<HTMLDivElement>(null);
    const peerRef = useRef<HTMLDivElement>(null);
    const attitudesRef = useRef<HTMLDivElement>(null);
    const responsivityRef = useRef<HTMLDivElement>(null);

    // Extract all data from presenter
    const {
      assessmentScore,
      assessmentType,
      assessmentDate,
      assessmentAdministeredBy,
      criminalHistoryLevel,
      criminalHistorySummary,
      educationLevelScore,
      employmentSummary,
      levelOfEducation,
      employedAtOffense,
      familySocialSupportLevel,
      familyAndSocialSupportSummary,
      neighborhoodLevel,
      housingSummary,
      peerAssociatesLevel,
      peerAssociatesSummary,
      criminalBehaviorLevel,
      criminalAttitudesSummary,
      responsivityAndBarriersSummary,
      substanceAbuseLevel,
      drugHistorySummary,
      criminalHistoryRiskLevel,
      educationRiskLevel,
      neighborhoodRiskLevel,
      substanceAbuseRiskLevel,
      familySocialSupportRiskLevel,
      peerAssociatesRiskLevel,
      criminalBehaviorRiskLevel,
    } = presenter.SARData ?? {};

    // Extract client data
    const { fatherName, motherName, guardianName } =
      presenter.SARData?.client ?? {};

    // Get domains configuration for this ORAS assessment type
    const domains = getDomainsForAssessmentType(assessmentType);
    const shouldRenderDomain = (key: ORASDomainKey) =>
      domains.some((d) => d.key === key);
    const getDomainTitle = (key: ORASDomainKey) =>
      domains.find((d) => d.key === key)?.title ?? "";
    const getDomainMaxScore = (key: ORASDomainKey) =>
      domains.find((d) => d.key === key)?.maxScore;

    // Build domain risk levels record for RiskCategorySummary (keyed by scoreField)
    const domainRiskLevels: Record<string, RiskLevelKey | null> = {
      criminalHistoryLevel: criminalHistoryRiskLevel ?? null,
      educationLevelScore: educationRiskLevel ?? null,
      familySocialSupportLevel: familySocialSupportRiskLevel ?? null,
      neighborhoodLevel: neighborhoodRiskLevel ?? null,
      substanceAbuseLevel: substanceAbuseRiskLevel ?? null,
      peerAssociatesLevel: peerAssociatesRiskLevel ?? null,
      criminalBehaviorLevel: criminalBehaviorRiskLevel ?? null,
    };

    const getDomainRiskLevel = (key: ORASDomainKey): RiskLevelKey | null => {
      const scoreField = domains.find((d) => d.key === key)?.scoreField;
      if (!scoreField) return null;
      return domainRiskLevels[scoreField] ?? null;
    };

    // Scroll to subsection when changed
    useEffect(() => {
      if (!currentSubsection) return;

      const refMap = {
        [OffenderAssessmentSubsection.CRIMINAL_HISTORY]: criminalHistoryRef,
        [OffenderAssessmentSubsection.EDUCATION_EMPLOYMENT]: educationRef,
        [OffenderAssessmentSubsection.FAMILY_SOCIAL_SUPPORT]: familyRef,
        [OffenderAssessmentSubsection.NEIGHBORHOOD_PROBLEMS]: neighborhoodRef,
        [OffenderAssessmentSubsection.SUBSTANCE_USE]: substanceUseRef,
        [OffenderAssessmentSubsection.PEER_ASSOCIATIONS]: peerRef,
        [OffenderAssessmentSubsection.CRIMINAL_ATTITUDES]: attitudesRef,
        [OffenderAssessmentSubsection.RESPONSIVITY_BARRIERS]: responsivityRef,
      };

      const targetRef =
        refMap[currentSubsection as OffenderAssessmentSubsection];

      if (targetRef?.current) {
        targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    }, [currentSubsection]);

    // Check if this assessment type has domains (screening/Other types don't)
    const hasDomains = domains.length > 0;

    return (
      <SectionContainer>
        <OrasAssessmentScoreCard
          score={assessmentScore ?? 0}
          assessmentType={assessmentType ?? null}
          assessmentDate={assessmentDate ?? null}
          administeredBy={assessmentAdministeredBy ?? null}
        />

        {hasDomains && (
          <RiskCategorySummary
            assessmentType={assessmentType ?? null}
            domainRiskLevels={domainRiskLevels}
          />
        )}

        {hasDomains && <Styled.DomainsTitle>Domains</Styled.DomainsTitle>}

        {shouldRenderDomain("criminalHistory") && (
          <DomainCard
            title={getDomainTitle("criminalHistory")}
            riskScore={criminalHistoryLevel ?? 0}
            maxDomainScore={getDomainMaxScore("criminalHistory")}
            riskLevel={getDomainRiskLevel("criminalHistory")}
            summaryValue={criminalHistorySummary ?? null}
            onSummaryChange={(value) =>
              presenter.updateCriminalHistorySummary(value)
            }
            cardRef={criminalHistoryRef}
          >
            <DomainCardStyled.InfoBox>
              Default text provided below. You can customize this language as
              needed.
              <br />
              Remember to export the CBRS screen from OPII and attach it to the
              completed report.
            </DomainCardStyled.InfoBox>
          </DomainCard>
        )}

        {shouldRenderDomain("educationEmployment") && (
          <DomainCard
            title={getDomainTitle("educationEmployment")}
            riskScore={educationLevelScore ?? 0}
            maxDomainScore={getDomainMaxScore("educationEmployment")}
            riskLevel={getDomainRiskLevel("educationEmployment")}
            helperText='Enter "None Listed" where not applicable'
            summaryValue={employmentSummary ?? null}
            onSummaryChange={(value) =>
              presenter.updateEmploymentSummary(value)
            }
            cardRef={educationRef}
          >
            <EmploymentHistoryCard presenter={presenter.offenderAssessment} />
            <EducationDropdown
              label="Highest Level of Education"
              value={levelOfEducation ?? null}
              onChange={(value) => presenter.updateLevelOfEducation(value)}
            />
            <BooleanDropdown
              label="Employed at Time of Offense"
              value={employedAtOffense ?? null}
              onChange={(value) => presenter.updateEmployedAtOffense(value)}
            />
          </DomainCard>
        )}

        {shouldRenderDomain("familySocialSupport") && (
          <DomainCard
            title={getDomainTitle("familySocialSupport")}
            riskScore={familySocialSupportLevel ?? 0}
            maxDomainScore={getDomainMaxScore("familySocialSupport")}
            riskLevel={getDomainRiskLevel("familySocialSupport")}
            helperText='Enter "None Listed" where not applicable'
            summaryValue={familyAndSocialSupportSummary ?? null}
            onSummaryChange={(value) =>
              presenter.updateFamilyAndSocialSupportSummary(value)
            }
            cardRef={familyRef}
          >
            <TextField
              label="Father"
              value={fatherName ?? null}
              onChange={(value) => presenter.updateFatherName(value)}
              placeholder="Enter father's name"
              halfWidth
            />
            <TextField
              label="Mother"
              value={motherName ?? null}
              onChange={(value) => presenter.updateMotherName(value)}
              placeholder="Enter mother's name"
              halfWidth
            />
            <TextField
              label="Who Raised Offender"
              value={guardianName ?? null}
              onChange={(value) => presenter.updateGuardianName(value)}
              placeholder="Enter who raised offender"
              halfWidth
            />
          </DomainCard>
        )}

        {shouldRenderDomain("neighborhoodProblems") && (
          <DomainCard
            title={getDomainTitle("neighborhoodProblems")}
            riskScore={neighborhoodLevel ?? 0}
            maxDomainScore={getDomainMaxScore("neighborhoodProblems")}
            riskLevel={getDomainRiskLevel("neighborhoodProblems")}
            summaryValue={housingSummary ?? null}
            onSummaryChange={(value) => presenter.updateHousingSummary(value)}
            cardRef={neighborhoodRef}
          />
        )}

        {shouldRenderDomain("substanceUse") && (
          <DomainCard
            title={getDomainTitle("substanceUse")}
            riskScore={substanceAbuseLevel ?? 0}
            maxDomainScore={getDomainMaxScore("substanceUse")}
            riskLevel={getDomainRiskLevel("substanceUse")}
            summaryValue={drugHistorySummary ?? null}
            onSummaryChange={(value) =>
              presenter.updateDrugHistorySummary(value)
            }
            cardRef={substanceUseRef}
          >
            <DrugHistoryCard presenter={presenter.offenderAssessment} />
          </DomainCard>
        )}

        {shouldRenderDomain("peerAssociates") && (
          <DomainCard
            title={getDomainTitle("peerAssociates")}
            riskScore={peerAssociatesLevel ?? 0}
            maxDomainScore={getDomainMaxScore("peerAssociates")}
            riskLevel={getDomainRiskLevel("peerAssociates")}
            summaryValue={peerAssociatesSummary ?? null}
            onSummaryChange={(value) =>
              presenter.updatePeerAssociatesSummary(value)
            }
            cardRef={peerRef}
          />
        )}

        {shouldRenderDomain("criminalAttitudes") && (
          <DomainCard
            title={getDomainTitle("criminalAttitudes")}
            riskScore={criminalBehaviorLevel ?? 0}
            maxDomainScore={getDomainMaxScore("criminalAttitudes")}
            riskLevel={getDomainRiskLevel("criminalAttitudes")}
            summaryValue={criminalAttitudesSummary ?? null}
            onSummaryChange={(value) =>
              presenter.updateCriminalAttitudesSummary(value)
            }
            cardRef={attitudesRef}
          />
        )}

        {shouldRenderDomain("responsivity") && (
          <DomainCard
            title={getDomainTitle("responsivity")}
            summaryValue={responsivityAndBarriersSummary ?? null}
            onSummaryChange={(value) =>
              presenter.updateResponsivityAndBarriersSummary(value)
            }
            cardRef={responsivityRef}
          />
        )}
      </SectionContainer>
    );
  },
);

OffenderAssessment.displayName = "OffenderAssessment";
