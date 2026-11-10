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

import React from "react";

import {
  InfoRequest,
  MessageSender,
  type ProviderInfoRequest,
} from "../InfoRequest";
import * as Styled from "./RequestsForInfo.styles";

interface RequestsForInfoBaseProps {
  infoRequests: ProviderInfoRequest[];
  providerName: string;
  staffName: string;
}

type RequestsForInfoProps = RequestsForInfoBaseProps &
  (
    | { readOnly: true; onSubmitInfo?: never }
    | {
        /** When true, hides the "Provide Info" action so requests are read-only. */
        readOnly?: false;
        onSubmitInfo: (message: string) => Promise<void>;
      }
  );

export const RequestsForInfo: React.FC<RequestsForInfoProps> = (props) => {
  const { infoRequests, providerName, staffName } = props;

  if (infoRequests.length === 0) {
    return null;
  }

  return (
    <Styled.RequestsSection>
      <Styled.RequestsSectionTitle>
        Requests for Info
      </Styled.RequestsSectionTitle>
      <Styled.RequestsList>
        {infoRequests.map((infoRequest) => {
          const providerMsg = infoRequest.messages.find(
            (m) => m.senderType === MessageSender.PROVIDER,
          );
          const staffMsg = infoRequest.messages.find(
            (m) => m.senderType === MessageSender.STAFF,
          );

          if (!providerMsg) return null;

          const staffResponse = staffMsg
            ? {
                responderName: staffName ? `${staffName} (CM)` : "Case Manager",
                message: staffMsg.body,
              }
            : undefined;

          return props.readOnly ? (
            <InfoRequest
              key={infoRequest.id}
              requesterName={providerName}
              message={providerMsg.body}
              response={staffResponse}
              showRequester
              status={infoRequest.status}
              readOnly
            />
          ) : (
            <InfoRequest
              key={infoRequest.id}
              requesterName={providerName}
              message={providerMsg.body}
              response={staffResponse}
              showRequester
              status={infoRequest.status}
              onProvideInfo={props.onSubmitInfo}
            />
          );
        })}
      </Styled.RequestsList>
    </Styled.RequestsSection>
  );
};
