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

import {
  DetailsHeading,
  DetailsSection,
  SecureDetailsContent,
} from "../../styles";
import { ResidentProfileProps } from "../../types";

const UsMoGangInvolvement: React.FC<ResidentProfileProps> = ({ resident }) => {
  const metadata = resident.metadata;
  if (metadata.stateCode !== "US_MO") return null;
  if (!metadata.gangAffiliation) return null;

  const copyMapping: Record<typeof metadata.gangAffiliation, string> = {
    "NON-STG MEMBER": "None",
    "STG MEMBER": "Known member",
    "STG ASSOCIATE": "Known associate",
  };

  return (
    <DetailsSection>
      <DetailsHeading>Gang Involvement</DetailsHeading>
      <SecureDetailsContent>
        {copyMapping[metadata.gangAffiliation]}
      </SecureDetailsContent>
    </DetailsSection>
  );
};

export default UsMoGangInvolvement;
