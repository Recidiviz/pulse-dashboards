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

import React from "react";

import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa/index";
import {
  DetailsBox,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export function UsIaVictimContactInfo({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (
    !(opportunity instanceof UsIaEarlyDischargeOpportunity) ||
    !opportunity.record.metadata.victimContactInfo
  ) {
    return null;
  }

  const contactInfo = opportunity.record.metadata.victimContactInfo;

  return (
    <DetailsSection>
      <DetailsHeading>Victim Contact Information</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          {contactInfo.map((contact) => {
            const fullName = `${contact.VictimFirstNm} ${contact.VictimLastNm}`;
            const phoneNumber =
              contact.CellPhone ??
              contact.HomePhone ??
              contact.WorkPhone ??
              contact.OtherPhone ??
              "N/A";
            const emailAddress = contact.EmailAddress ?? "N/A";
            const address = contact.Address1
              ? `${contact.Address1}, ` +
                (contact.Address2 ? `${contact.Address2}, ` : "") +
                `${contact.City}, ${contact.State} ${contact.ZipCode}`
              : "N/A";
            return (
              <DetailsBox key={fullName}>
                {fullName && (
                  <div>
                    <DetailsSubheading>Victim Name</DetailsSubheading>
                    <SecureDetailsContent>{fullName}</SecureDetailsContent>
                  </div>
                )}
                {phoneNumber && (
                  <div>
                    <DetailsSubheading>Phone Number</DetailsSubheading>
                    <SecureDetailsContent>{phoneNumber}</SecureDetailsContent>
                  </div>
                )}
                {emailAddress && (
                  <div>
                    <DetailsSubheading>Email Address</DetailsSubheading>
                    <SecureDetailsContent>{emailAddress}</SecureDetailsContent>
                  </div>
                )}
                {address && (
                  <div>
                    <DetailsSubheading>Address</DetailsSubheading>
                    <SecureDetailsContent>{address}</SecureDetailsContent>
                  </div>
                )}
              </DetailsBox>
            );
          })}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}
