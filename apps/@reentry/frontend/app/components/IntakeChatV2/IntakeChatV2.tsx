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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWSClient } from "@trpc/client";
import {
  createTRPCReact,
  httpBatchLink,
  splitLink,
  wsLink,
} from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";

import Chat from "~@reentry/frontend/components/IntakeChatV2/Chat/Chat";
import ChatHeader from "~@reentry/frontend/components/IntakeChatV2/ChatHeader/ChatHeader";
import IntakeLogin from "~@reentry/frontend/components/IntakeChatV2/IntakeLogin/IntakeLogin";
import PreIntake from "~@reentry/frontend/components/IntakeChatV2/PreIntake/PreIntake";
import { useIntakeAuthContext } from "~@reentry/frontend/components/IntakeChatV2/providers/IntakeAuthProvider";
import { ConnectionState } from "~@reentry/frontend/components/IntakeChatV2/types";
import type { AppRouter } from "~@reentry/trpc-types";

export const trpc = createTRPCReact<AppRouter>();

const IntakeChatV2 = () => {
  const { token, firstName, lastName, stateCode } = useIntakeAuthContext();

  if (!token) {
    return <IntakeLogin />;
  }

  const [isPreIntakeComplete, setIsPreIntakeComplete] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [connectionError, setConnectionError] = useState<Event>();
  const [queryClient] = useState(() => new QueryClient());
  const [wsClient] = useState(() =>
    createWSClient({
      url: process.env["NEXT_PUBLIC_API_URL"] + "/trpc",
      connectionParams: () => ({
        statecode: stateCode ?? "",
        authorization: `Bearer ${token}`,
      }),
      onOpen: () => setConnectionState("connected"),
      onClose: () => setConnectionState("closed"),
      onError: (err) => {
        setConnectionState("error");
        setConnectionError(err);
      },
    }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition(op) {
            return op.type === "subscription";
          },
          true: wsLink({ client: wsClient, transformer: superjson }),
          false: httpBatchLink({
            url: process.env["NEXT_PUBLIC_API_URL"] + "/trpc",
            headers: () => ({
              statecode: stateCode ?? "",
              authorization: `Bearer ${token}`,
            }),
            transformer: superjson,
          }),
        }),
      ],
    }),
  );
  // TODO: Call Get/Create Intake Route to get an intakeId
  const intakeId = "intake-id-placeholder";

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <ChatHeader firstName={firstName} lastName={lastName} />
        <PreIntake onStartIntake={() => setIsPreIntakeComplete(true)} />
        {isPreIntakeComplete && (
          <Chat
            intakeId={intakeId}
            connectionStatus={{ connectionState, connectionError }}
          />
        )}
      </trpc.Provider>
    </QueryClientProvider>
  );
};

export default IntakeChatV2;
