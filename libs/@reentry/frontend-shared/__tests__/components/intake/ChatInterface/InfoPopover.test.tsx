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

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { InfoPopover } from "../../../../src/components/intake/ChatInterface/InfoPopover";

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

const noteOneCopy = {
  title: "Your Community Intake",
  paragraphs: [
    "This intake is designed to help your case manager.",
    "Please provide honest answers.",
  ],
};

const noteTwoCopy = {
  title: "Before You Start",
  faqItems: [{ question: "Who will I chat with?", answer: "A chatbot." }],
  importantItems: [{ label: "Time:", text: "This will take 45 minutes." }],
};

describe("InfoPopover", () => {
  it("renders the trigger button", () => {
    render(<InfoPopover noteOneCopy={noteOneCopy} noteTwoCopy={noteTwoCopy} />);
    expect(
      screen.getByRole("button", { name: "About this assessment" }),
    ).toBeDefined();
  });

  it("does not show panel content when closed", () => {
    render(<InfoPopover noteOneCopy={noteOneCopy} noteTwoCopy={noteTwoCopy} />);
    expect(screen.queryByText("About this assessment")).toBeNull();
  });

  it("shows the panel when trigger is clicked", () => {
    render(<InfoPopover noteOneCopy={noteOneCopy} noteTwoCopy={noteTwoCopy} />);
    fireEvent.click(
      screen.getByRole("button", { name: "About this assessment" }),
    );
    expect(screen.getByText("About this assessment")).toBeDefined();
  });

  it("renders noteOneCopy paragraphs when open", () => {
    render(<InfoPopover noteOneCopy={noteOneCopy} noteTwoCopy={noteTwoCopy} />);
    fireEvent.click(
      screen.getByRole("button", { name: "About this assessment" }),
    );
    expect(
      screen.getByText("This intake is designed to help your case manager."),
    ).toBeDefined();
    expect(screen.getByText("Please provide honest answers.")).toBeDefined();
  });

  it("renders noteTwoCopy faq items when open", () => {
    render(<InfoPopover noteOneCopy={noteOneCopy} noteTwoCopy={noteTwoCopy} />);
    fireEvent.click(
      screen.getByRole("button", { name: "About this assessment" }),
    );
    expect(screen.getByText("Who will I chat with?")).toBeDefined();
    expect(screen.getByText("A chatbot.")).toBeDefined();
  });

  it("renders noteTwoCopy important items when open", () => {
    render(<InfoPopover noteOneCopy={noteOneCopy} noteTwoCopy={noteTwoCopy} />);
    fireEvent.click(
      screen.getByRole("button", { name: "About this assessment" }),
    );
    expect(screen.getByText("Time:")).toBeDefined();
    expect(screen.getByText(/This will take 45 minutes/)).toBeDefined();
  });

  it("toggles the panel closed when trigger is clicked again", () => {
    render(<InfoPopover noteOneCopy={noteOneCopy} noteTwoCopy={noteTwoCopy} />);
    const trigger = screen.getByRole("button", {
      name: "About this assessment",
    });
    fireEvent.click(trigger);
    expect(screen.getByText("About this assessment")).toBeDefined();
    fireEvent.click(trigger);
    expect(screen.queryByText("About this assessment")).toBeNull();
  });
});
