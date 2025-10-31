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

import { useEffect, useState } from "react";

import Address from "~@reentry/frontend/components/IntakeChatV2/Address/Address";
import { legacyApiRequest } from "~@reentry/frontend/components/IntakeChatV2/api/api";
import ConversationLayout from "~@reentry/frontend/components/IntakeChatV2/Chat/ConversationLayout";
import IntakeComplete from "~@reentry/frontend/components/IntakeChatV2/IntakeComplete/IntakeComplete";
import PreIntake from "~@reentry/frontend/components/IntakeChatV2/Interstitials/PreIntake/PreIntake";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import { ChatProvider } from "~@reentry/frontend/components/IntakeChatV2/providers/ChatProvider";
import { useIntakeAuthContext } from "~@reentry/frontend/components/IntakeChatV2/providers/IntakeAuthProvider";
import Survey from "~@reentry/frontend/components/IntakeChatV2/Survey/Survey";
import { trpc } from "~@reentry/frontend/trpc";
import { useTrpcConnection } from "~@reentry/frontend/trpc/TrpcReactQueryProvider";

interface IntakeStatusResponse {
  has_survey: boolean;
}

interface ChatProps {
  clientId: string | null;
}

const Chat = ({ clientId }: ChatProps) => {
  const connectionStatus = useTrpcConnection();
  const { token } = useIntakeAuthContext();
  const [chatSessionKey, setChatSessionKey] = useState(0);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [isFetchingSurveyStatus, setIsFetchingSurveyStatus] = useState(false);

  if (!clientId) return null;

  const { data: intake, isLoading: isLoadingIntake } =
    trpc.intake.getIntake.useQuery({
      clientPseudoId: clientId,
    });
  const { data: address, isLoading: isLoadingAddress } =
    trpc.clientRecords.getAddress.useQuery(
      {
        clientPseudoId: clientId,
      },
      {
        // Only fetch address if intake is complete
        enabled: Boolean(intake?.endDate),
      },
    );

  // Fetch survey status from old backend when intake is complete and address exists
  // TODO: Consider porting survey status to new backend to avoid this extra request
  useEffect(() => {
    if (intake?.endDate && address && token && !surveySubmitted) {
      setIsFetchingSurveyStatus(true);
      legacyApiRequest<IntakeStatusResponse>(`/intake/client/${token}`, {
        token,
      })
        .then((response) => {
          if (response.has_survey) {
            setSurveySubmitted(true);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch survey status:", error);
        })
        .finally(() => {
          setIsFetchingSurveyStatus(false);
        });
    }
  }, [intake?.endDate, address, token, surveySubmitted]);

  if (isLoadingIntake || isLoadingAddress || isFetchingSurveyStatus) {
    return <Loading />;
  }

  if (!intake) return <PreIntake clientPseudoId={clientId} />;

  if (intake.endDate) {
    if (!address) {
      return <Address clientPseudoId={clientId} intakeId={intake.id} />;
    }

    if (!surveySubmitted) {
      return <Survey onSurveySubmitted={() => setSurveySubmitted(true)} />;
    }

    return <IntakeComplete />;
  }

  return (
    <ChatProvider
      key={chatSessionKey}
      intake={intake}
      clientId={clientId}
      connectionStatus={connectionStatus}
      setChatSessionKey={setChatSessionKey}
    >
      <ConversationLayout connectionStatus={connectionStatus} />
    </ChatProvider>
  );
};

export default Chat;
