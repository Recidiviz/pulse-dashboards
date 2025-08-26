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

"use client";

import Chat from "~@reentry/frontend/components/IntakeChatV2/Chat/Chat";
import ChatHeader from "~@reentry/frontend/components/IntakeChatV2/ChatHeader/ChatHeader";
import IntakeLogin from "~@reentry/frontend/components/IntakeChatV2/IntakeLogin/IntakeLogin";
import { useIntakeAuthContext } from "~@reentry/frontend/components/IntakeChatV2/providers/IntakeAuthProvider";
import { TrpcReactQueryProvider } from "~@reentry/frontend/trpc/TrpcReactQueryProvider";

const IntakeChatV2 = () => {
  const { token, firstName, lastName, stateCode, clientId } =
    useIntakeAuthContext();

  if (!token) {
    return <IntakeLogin />;
  }

  return (
    <TrpcReactQueryProvider enableWS token={token} stateCode={stateCode}>
      <ChatHeader firstName={firstName} lastName={lastName} />
      <Chat clientId={clientId} />
    </TrpcReactQueryProvider>
  );
};

export default IntakeChatV2;
