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

import {
  DetailsHeading,
  DetailsSection,
  ShadedSidebarTableCell,
  SidebarTable,
  SidebarTableCell,
  SidebarTableRow,
} from "../../styles";
import { ResidentProfileProps } from "../../types";

const Row: React.FC<{ label: string; score?: number | null }> = ({
  label,
  score,
}) => {
  return (
    <SidebarTableRow $wideLeftColumn>
      <ShadedSidebarTableCell>{label}</ShadedSidebarTableCell>
      <SidebarTableCell>{score ?? "N/A"}</SidebarTableCell>
    </SidebarTableRow>
  );
};

const UsMoAssessmentScores: React.FC<ResidentProfileProps> = ({ resident }) => {
  const metadata = resident.metadata;
  if (metadata.stateCode !== "US_MO") return null;

  return (
    <DetailsSection>
      <DetailsHeading>Assessment Scores</DetailsHeading>
      <SidebarTable>
        <tbody>
          <Row label="Medical" score={metadata.medicalScore} />
          <Row label="Public Risk" score={metadata.publicRiskScore} />
          <Row
            label="Institutional Risk"
            score={metadata.institutionalRiskScore}
          />
          <Row label="Education" score={metadata.educationScore} />
          <Row label="Mental Health" score={metadata.mentalHealthScore} />
        </tbody>
      </SidebarTable>
    </DetailsSection>
  );
};

export default UsMoAssessmentScores;
