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

import React, { useState } from "react";
import toast from "react-hot-toast";

import { ActionButton } from "~@idaho-th/client/components/common/buttons";
import { InfoRequestStatus } from "~@idaho-th/client/constants/common";
import { InfoRequestStatusType } from "~@idaho-th/client/interfaces/common";
import { Button2 } from "~@idaho-th/client/styles";

import HouseIcon from "../../../assets/house-icon.svg?react";
import QuotesIcon from "../../../assets/quotes-icon.svg?react";
import UserIcon from "../../../assets/user-icon.svg?react";
import * as Styled from "./InfoRequest.styles";
import { InfoResponseModal } from "./InfoResponseModal";

export interface InfoRequestResponse {
  responderName: string;
  message: string;
}

interface InfoRequestBaseProps {
  requesterName: string;
  message: string;
  showRequester?: boolean;
  response?: InfoRequestResponse;
  buttonVariant?: "primary" | "secondary";
  status?: InfoRequestStatusType;
}

type InfoRequestProps = InfoRequestBaseProps &
  (
    | { readOnly: true; onProvideInfo?: never }
    | {
        readOnly?: false;
        onProvideInfo: (response: string) => void | Promise<void>;
      }
  );

export const InfoRequest: React.FC<InfoRequestProps> = ({
  requesterName,
  message,
  showRequester = false,
  response,
  onProvideInfo,
  buttonVariant = "primary",
  status,
  readOnly = false,
}) => {
  const isClosed = status === InfoRequestStatus.CLOSED;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleProvideInfo = async (responseText: string) => {
    if (!onProvideInfo) {
      toast.error("Failed to submit info. Please try again.");
      return;
    }
    try {
      setIsLoading(true);
      await onProvideInfo(responseText);
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to submit info. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Styled.InfoRequestRoot>
        <Styled.MessageRow>
          <Styled.VerticalDivider />
          {showRequester ? (
            <Styled.MessageColumn>
              <Styled.RequesterRow>
                <Styled.IconWrapper>
                  <HouseIcon />
                </Styled.IconWrapper>
                <Styled.RequesterName>{requesterName}</Styled.RequesterName>
              </Styled.RequesterRow>
              <Styled.ScrollableText>{message}</Styled.ScrollableText>
            </Styled.MessageColumn>
          ) : (
            <Styled.ScrollableText>{message}</Styled.ScrollableText>
          )}
          <QuotesIcon />
        </Styled.MessageRow>

        {response && (
          <Styled.ResponseCard>
            <Styled.ResponseHeader>
              <Styled.IconWrapper>
                <UserIcon />
              </Styled.IconWrapper>
              <Styled.ResponderName>
                {response.responderName}
              </Styled.ResponderName>
            </Styled.ResponseHeader>
            <Styled.ScrollableText>{response.message}</Styled.ScrollableText>
          </Styled.ResponseCard>
        )}
        {!readOnly && !response && !isClosed && (
          <ActionButton
            height="32px"
            onClick={() => {
              setIsModalOpen(true);
            }}
            variant={buttonVariant}
          >
            <Button2>Provide Info</Button2>
          </ActionButton>
        )}
      </Styled.InfoRequestRoot>

      {!readOnly && (
        <InfoResponseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleProvideInfo}
          providerName={requesterName}
          message={message}
          isLoading={isLoading}
        />
      )}
    </>
  );
};
