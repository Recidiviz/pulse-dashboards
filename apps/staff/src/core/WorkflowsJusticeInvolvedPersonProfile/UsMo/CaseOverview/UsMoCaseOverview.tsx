// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Sans16, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { UsMoClientMetadata } from "~datatypes";
import { palette } from "~design-system";

import { Client } from "../../../../WorkflowsStore";
import { ClientInformationCard } from "./ClientInformationCard";

const StyledClientInformationCard = styled(ClientInformationCard)`
  margin-bottom: ${rem(spacing.md)};
`;

/** "Case Overview" heading shown above the bordered `ClientInformationCard`.
 * Matches the `SectionHeading` style used by other left-column sections in
 * `FullProfile` (slate80 / Sans16 / 500). `margin-bottom` is zeroed so the
 * heading sits flush above the card; the card itself attaches the
 * `spacing.md` gap below via `StyledClientInformationCard`. */
const SectionHeading = styled(Sans16)`
  color: ${palette.slate80};
  margin-bottom: 0;
`;

type UsMoCaseOverviewProps = {
  client: Client;
};

/**
 * "Case Overview" section for the US_MO supervision profile. Renders the
 * section heading and a bordered `ClientInformationCard` (Personal Details +
 * Housing) for the client's most recent supervision data.
 *
 * Reads data directly off the `Client` MobX instance — already hydrated and
 * reactive via the caseload-level `clientsSubscription` in `WorkflowsStore`.
 * No per-record fetch / Suspense boundary / skeleton; the parent `FullProfile`
 * gates rendering on a non-null `selectedPerson` and on
 * `instanceof Client && stateCode === "US_MO"`, so by the time this mounts
 * the metadata is known to be the US_MO variant — hence the cast.
 */
export const UsMoCaseOverview = observer(function UsMoCaseOverview({
  client,
}: UsMoCaseOverviewProps): React.ReactElement {
  const { sex, birthdate, latestCycleSentences } =
    client.metadata as UsMoClientMetadata;

  return (
    <>
      <SectionHeading>Case Overview</SectionHeading>
      <StyledClientInformationCard
        sex={sex}
        birthdate={birthdate}
        latestCycleSentences={latestCycleSentences}
        address={client.currentPhysicalResidenceAddressStructured}
      />
    </>
  );
});
