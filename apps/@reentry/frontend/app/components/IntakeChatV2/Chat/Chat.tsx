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

import Address from "~@reentry/frontend/components/IntakeChatV2/Address/Address";
import ConversationLayout from "~@reentry/frontend/components/IntakeChatV2/Chat/ConversationLayout";
import { trpc } from "~@reentry/frontend/components/IntakeChatV2/IntakeChatV2";
import IntakeComplete from "~@reentry/frontend/components/IntakeChatV2/IntakeComplete/IntakeComplete";
import Loading from "~@reentry/frontend/components/IntakeChatV2/Loading/Loading";
import PreIntake from "~@reentry/frontend/components/IntakeChatV2/PreIntake/PreIntake";
import { ChatProvider } from "~@reentry/frontend/components/IntakeChatV2/providers/ChatProvider";
import { ConnectionStatus } from "~@reentry/frontend/components/IntakeChatV2/types";

interface ChatProps {
  clientId: string | null;
  connectionStatus?: ConnectionStatus;
}

const Chat = ({ clientId, connectionStatus }: ChatProps) => {
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

  if (isLoadingIntake || isLoadingAddress) return <Loading />;

  if (!intake) return <PreIntake clientPseudoId={clientId} />;

  if (intake.endDate) {
    if (!address) return <Address clientPseudoId={clientId} />;
    return <IntakeComplete />;
  }
  return (
    <ChatProvider intake={intake}>
      <ConversationLayout connectionStatus={connectionStatus} />
    </ChatProvider>
  );
};

export default Chat;
