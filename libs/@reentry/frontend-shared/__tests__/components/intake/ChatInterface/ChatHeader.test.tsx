// @vitest-environment jsdom

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

import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatHeader } from "../../../../src/components/intake/ChatInterface/ChatHeader";
import type { ApplicationContext } from "../../../../src/contexts/ApplicationContext";
import { useApplicationContext } from "../../../../src/contexts/ApplicationContext";
import { useSocket } from "../../../../src/websockets/IntakeSocketContext";

vi.mock("../../../../src/websockets/IntakeSocketContext");
vi.mock("../../../../src/contexts/ApplicationContext");
vi.mock("../../../../src/utils/clearIntakeSession");

vi.mock("@floating-ui/react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@floating-ui/react")>();
  return {
    ...mod,
    autoUpdate: vi.fn(() => vi.fn()),
    FloatingPortal: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    FloatingArrow: () => null,
  };
});

const mockUseSocket = vi.mocked(useSocket);
const mockUseApplicationContext = vi.mocked(useApplicationContext);

const baseIntakeContext = {
  client_name: "Alex Johnson",
  clientPseudoId: "CPA-00291",
  allSections: [],
  conversationStarted: false,
  currentSection: null,
  client_state: "US_NE",
  messages: [],
  connectionStatus: "connected" as const,
  waitingForAIInput: false,
  intakeStatus: undefined,
  isLoading: false,
  has_accepted_terms: false,
  has_address: false,
  has_survey: false,
};

const baseDispatchContext = {
  sendMessage: vi.fn(),
  reconnect: vi.fn(),
  handleClickDisconnect: vi.fn(),
  startConversation: vi.fn(),
  setIntakeComplete: vi.fn(),
  lockIntake: vi.fn(),
  clearGuardrailSoftStop: vi.fn(),
};

beforeEach(() => {
  mockUseSocket.mockReturnValue({
    intakeContext: baseIntakeContext,
    intakeDispatchContext: baseDispatchContext,
  });
  mockUseApplicationContext.mockReturnValue({
    navigateAfterIntake: vi.fn(),
  } as unknown as ApplicationContext);
});

describe("ChatHeader", () => {
  it("renders the client name", () => {
    render(<ChatHeader isConversationInProgress={false} />);
    expect(screen.getByText("Alex Johnson")).toBeDefined();
  });

  it("renders the info button when conversation is in progress", () => {
    render(<ChatHeader isConversationInProgress={true} />);
    expect(
      screen.getByRole("button", { name: "About this assessment" }),
    ).toBeDefined();
  });

  it("does not render the info button when conversation is not in progress", () => {
    render(<ChatHeader isConversationInProgress={false} />);
    expect(
      screen.queryByRole("button", { name: "About this assessment" }),
    ).toBeNull();
  });
});
