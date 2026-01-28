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

import { palette } from "~design-system";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { OffenderAssessmentSubsection } from "../SARDetails/constants";
import { SkippableTextArea } from "../shared/SkippableTextArea/SkippableTextArea";
import { DomainCard } from "./DomainCard";
import * as DomainCardStyled from "./DomainCard.styles";
import { EmploymentHistoryCard } from "./EmploymentHistory";
import {
  BooleanDropdown,
  EducationDropdown,
  TextField,
} from "./FormComponents";
import * as Styled from "./OffenderAssessment.styles";
import { DrugHistoryCard } from "./SubstanceUse";

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
      homePlan,
      peerAssociatesLevel,
      peerAssociatesSummary,
      criminalBehaviorLevel,
      criminalAttitudesSummary,
      responsivityLevel,
      responsivityAndBarriersSummary,
    } = presenter.SARData ?? {};

    // Extract client data
    const { fatherName, motherName, guardianName } =
      presenter.SARData?.client ?? {};

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

    return (
      <Styled.Container>
        <Styled.DomainsTitle>Domains</Styled.DomainsTitle>

        <DomainCard
          title="Criminal History"
          riskScore={criminalHistoryLevel ?? 0}
          summaryValue={criminalHistorySummary ?? null}
          onSummaryChange={(value) =>
            presenter.updateCriminalHistorySummary(value)
          }
          cardRef={criminalHistoryRef}
          summaryPlaceholder="The defendant's complete criminal history is attached to this report."
          summaryPlaceholderColor={palette.pine1}
        >
          <DomainCardStyled.InfoBox>
            Default text provided below. You can customize this language as
            needed.
            <br />
            Remember to export the CBRS screen from OPII and attach it to the
            completed report.
          </DomainCardStyled.InfoBox>
        </DomainCard>

        <DomainCard
          title="Education, Employment, and Financial Situation"
          riskScore={educationLevelScore ?? 0}
          helperText='Enter "None Listed" where not applicable'
          summaryValue={employmentSummary ?? null}
          onSummaryChange={(value) => presenter.updateEmploymentSummary(value)}
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

        <DomainCard
          title="Family and Social Support"
          riskScore={familySocialSupportLevel ?? 0}
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

        <DomainCard
          title="Neighborhood Problems"
          riskScore={neighborhoodLevel ?? 0}
          summaryValue={housingSummary ?? null}
          onSummaryChange={(value) => presenter.updateHousingSummary(value)}
          cardRef={neighborhoodRef}
        >
          <SkippableTextArea
            label="Home Plan"
            value={homePlan ?? null}
            onChange={(value) => presenter.updateHomePlan(value)}
            placeholder="Enter home plan details"
            height="6.8125rem"
          />
        </DomainCard>

        <DrugHistoryCard presenter={presenter} cardRef={substanceUseRef} />

        <DomainCard
          title="Peer Associations"
          riskScore={peerAssociatesLevel ?? 0}
          summaryValue={peerAssociatesSummary ?? null}
          onSummaryChange={(value) =>
            presenter.updatePeerAssociatesSummary(value)
          }
          cardRef={peerRef}
        />

        <DomainCard
          title="Criminal Attitudes and Behavioral Patterns"
          riskScore={criminalBehaviorLevel ?? 0}
          summaryValue={criminalAttitudesSummary ?? null}
          onSummaryChange={(value) =>
            presenter.updateCriminalAttitudesSummary(value)
          }
          cardRef={attitudesRef}
        />

        <DomainCard
          title="Responsivity Issues and Other Barriers"
          riskScore={responsivityLevel ?? 0}
          summaryValue={responsivityAndBarriersSummary ?? null}
          onSummaryChange={(value) =>
            presenter.updateResponsivityAndBarriersSummary(value)
          }
          cardRef={responsivityRef}
        />
      </Styled.Container>
    );
  },
);

OffenderAssessment.displayName = "OffenderAssessment";
