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

import { Client } from "../../WorkflowsStore";

type EmailProps = {
  mapDirectionsUrl: string;
  today: string;
  selectedClients: readonly Client[];
  mapsAddressLink: (address: string) => string;
  piiEmailAccessEnabled: boolean;
  idTitle: string;
};

/**
 * Template for HCRP that translates HTML into string to allow
 * for React automatic escaping through JSX.
 */
export const SelectedClientsEmailTemplate = ({
  mapDirectionsUrl,
  today,
  selectedClients,
  mapsAddressLink,
  piiEmailAccessEnabled,
  idTitle,
}: EmailProps) => {
  return (
    <>
      <p>Hi,</p>
      <p>
        {`Here is the Google Maps link, generated on ${today}, that you requested from the
        Recidiviz Home Contact Route Planner: `}
        <a href={mapDirectionsUrl}>{mapDirectionsUrl}</a>
      </p>
      <p>
        Best,
        <br />
        The Recidiviz Team
      </p>
      <br />
      <i>
        If you believe you've received this email in error or this email
        contains incorrect information, please email feedback@recidiviz.org to
        let us know.
      </i>
      {piiEmailAccessEnabled && (
        <>
          <p>--</p>
          <p>
            Below is a list of your selected clients in the order they appear on
            the map linked above:
          </p>
          <br />
          {selectedClients.map((person, index) => {
            if (!person.formattedAddress) return;

            return (
              <p>
                <u>
                  {`${index + 1}: `}
                  <span>{person.displayName}</span>
                </u>
                <a
                  href={mapsAddressLink(person.formattedAddress)}
                >{`(Google Maps Link)`}</a>
                <br />
                <b> Address: </b>
                <span>{person.formattedAddress}</span>
                <br />
                <span>
                  <b>Phone Number: </b>
                  {!person.phoneNumberUri || !person.phoneNumber ? (
                    <span>Phone number not found</span>
                  ) : (
                    <a href={person.phoneNumberUri}>
                      {" "}
                      <span>{person.phoneNumber}</span>
                    </a>
                  )}
                  <br />
                </span>
                <b>{`${idTitle} #: `}</b>
                <span>{person.externalId}</span>
                <br />
                <b>Supervision Level: </b>
                <span>{person.supervisionLevel}</span>
                <br />
                <b>Address Notes: </b>
                <span>{person.addressNotes ?? "N/A"}</span>
                <br />
                <b>Field Notes</b> for you to add:
                <br />
              </p>
            );
          })}
        </>
      )}
    </>
  );
};
