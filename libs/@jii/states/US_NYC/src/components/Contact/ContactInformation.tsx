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

import { FC } from "react";

import type { ContactDetails } from "../../hooks/types";
import {
  ContactLastUpdated,
  ContactSectionWrapper,
} from "./ContactInformation.styles";
import { GeneralContactSection } from "./GeneralContactSection";
import { LocationGroupsSection } from "./LocationGroupsSection";

type ContactInformationProps = {
  data: ContactDetails;
  generalContactHeading: string;
  locationGroupsHeading: string;
  lastUpdated: string;
};

export const ContactInformation: FC<ContactInformationProps> = ({
  data: { generalContactRows, locationGroups },
  generalContactHeading,
  locationGroupsHeading,
  lastUpdated,
}) => {
  if (generalContactRows.length === 0 && locationGroups.length === 0)
    return null;

  // Only standalone phones/websites — no address grouping needed, show in the general contact section
  if (locationGroups.length === 0) {
    return (
      <ContactSectionWrapper>
        <GeneralContactSection
          heading={generalContactHeading}
          rows={generalContactRows}
        />
        <ContactLastUpdated>{lastUpdated}</ContactLastUpdated>
      </ContactSectionWrapper>
    );
  }

  // Single address with no standalone phones/websites — one location doesn't warrant a separate Locations
  // section, fold its rows into the general contact section
  if (locationGroups.length === 1 && generalContactRows.length === 0) {
    return (
      <ContactSectionWrapper>
        <GeneralContactSection
          heading={generalContactHeading}
          rows={locationGroups[0].rows}
        />
        <ContactLastUpdated>{lastUpdated}</ContactLastUpdated>
      </ContactSectionWrapper>
    );
  }

  // Multiple addresses, or standalone phones/websites alongside addresses — standalone goes in the general
  // contact section and addresses go in a separate location groups section
  return (
    <ContactSectionWrapper>
      {generalContactRows.length > 0 && (
        <GeneralContactSection
          heading={generalContactHeading}
          rows={generalContactRows}
        />
      )}
      <LocationGroupsSection
        heading={locationGroupsHeading}
        groups={locationGroups}
      />
      <ContactLastUpdated>{lastUpdated}</ContactLastUpdated>
    </ContactSectionWrapper>
  );
};
