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

import React from "react";

import AngerManagementIcon from "../../../assets/anger-management-icon.svg?react";
import CaseManagementIcon from "../../../assets/case-management-icon.svg?react";
import ClothingAndToiletriesIcon from "../../../assets/clothing-toiletries-icon.svg?react";
import DomesticViolenceIssuesIcon from "../../../assets/domestic-violence-issues-icon.svg?react";
import EducationIcon from "../../../assets/education-icon.svg?react";
import FamilyServicesIcon from "../../../assets/family-services-icon.svg?react";
import FinancialAssistanceIcon from "../../../assets/financial-assistance-icon.svg?react";
import FoodInsecurityIcon from "../../../assets/food-insecurity-icon.svg?react";
import GeneralReEntrySupportIcon from "../../../assets/general-re-entry-support-icon.svg?react";
import HealthcareIcon from "../../../assets/healthcare-icon.svg?react";
import HousingOpportunitiesIcon from "../../../assets/housing-opportunities-icon.svg?react";
import JobTrainingOrOpportunitiesIcon from "../../../assets/job-training-or-opportunities-icon.svg?react";
import MentalHealthIcon from "../../../assets/mental-health-icon.svg?react";
import SubstanceUseIcon from "../../../assets/substance-use-icon.svg?react";
import TransportationIcon from "../../../assets/transportation-icon.svg?react";
import { NeedsToBeAddressed } from "../../constants";

export const NeedsIcons: Record<string, React.JSX.Element | null> = {
  [NeedsToBeAddressed["AngerManagement"]]: <AngerManagementIcon />,
  [NeedsToBeAddressed["CaseManagement"]]: <CaseManagementIcon />,
  [NeedsToBeAddressed["ClothingAndToiletries"]]: <ClothingAndToiletriesIcon />,
  [NeedsToBeAddressed["DomesticViolenceIssues"]]: (
    <DomesticViolenceIssuesIcon />
  ),
  [NeedsToBeAddressed["Education"]]: <EducationIcon />,
  [NeedsToBeAddressed["FamilyServices"]]: <FamilyServicesIcon />,
  [NeedsToBeAddressed["FinancialAssistance"]]: <FinancialAssistanceIcon />,
  [NeedsToBeAddressed["FoodInsecurity"]]: <FoodInsecurityIcon />,
  [NeedsToBeAddressed["GeneralReEntrySupport"]]: <GeneralReEntrySupportIcon />,
  [NeedsToBeAddressed["Healthcare"]]: <HealthcareIcon />,
  [NeedsToBeAddressed["HousingOpportunities"]]: <HousingOpportunitiesIcon />,
  [NeedsToBeAddressed["JobTrainingOrOpportunities"]]: (
    <JobTrainingOrOpportunitiesIcon />
  ),
  [NeedsToBeAddressed["MentalHealth"]]: <MentalHealthIcon />,
  [NeedsToBeAddressed["SubstanceUse"]]: <SubstanceUseIcon />,
  [NeedsToBeAddressed["Transportation"]]: <TransportationIcon />,
  Other: null,
};
