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

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HOME_PLAN_TYPE } from "~@idaho-th/client/constants/common";
import type { HomePlan } from "~@idaho-th/client/interfaces/common";

import { renderWithStore } from "../../../../../test/renderWithStore";
import { HomePlanRow } from "../HomePlanRow";

const providerPlan = {
  type: HOME_PLAN_TYPE.PROVIDER,
  address: null,
  updatedAt: new Date("2026-03-04T15:30:00Z"),
  provider: {
    id: "provider-1",
    name: "Example House",
    contact: {
      contactName: "Jane Doe",
      email: "jane.doe@example.com",
      contactPhone: "208-555-0100",
    },
    status: "CONDITIONALLY_APPROVED",
  },
} as unknown as HomePlan;

const manualAddressPlan = {
  type: HOME_PLAN_TYPE.MANUAL_ADDRESS,
  address: "12 Example St, Boise, ID",
  updatedAt: new Date("2026-03-04T15:30:00Z"),
  provider: null,
} as unknown as HomePlan;

let onAddAddress: ReturnType<typeof vi.fn>;
let onSelectProvider: ReturnType<typeof vi.fn>;
let onCopy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  onAddAddress = vi.fn();
  onSelectProvider = vi.fn();
  onCopy = vi.fn().mockResolvedValue(true);
});

function renderRow(props: Partial<Parameters<typeof HomePlanRow>[0]> = {}) {
  return renderWithStore(
    <HomePlanRow
      homePlan={null}
      onAddAddress={onAddAddress}
      onSelectProvider={onSelectProvider}
      onCopy={onCopy}
      {...props}
    />,
  );
}

describe("HomePlanRow", () => {
  it("shows nothing actionable while the home plan loads", () => {
    renderRow({ isLoading: true });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter a home plan")).not.toBeInTheDocument();
  });

  describe("with no home plan yet", () => {
    it("offers both ways to enter one", () => {
      renderRow({ isSelectProviderDisabled: false });

      expect(screen.getByText("Enter a home plan")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Enter an address manually" }),
      ).toBeEnabled();
      expect(
        screen.getByRole("button", { name: "Select a provider" }),
      ).toBeEnabled();
    });

    it("disables select-a-provider by default, before eligibility is known", () => {
      renderRow();

      expect(
        screen.getByRole("button", { name: "Select a provider" }),
      ).toBeDisabled();
    });

    it("reports a manual-address entry to the caller", async () => {
      const user = userEvent.setup();
      renderRow();

      await user.click(
        screen.getByRole("button", { name: "Enter an address manually" }),
      );

      expect(onAddAddress).toHaveBeenCalledTimes(1);
      expect(onSelectProvider).not.toHaveBeenCalled();
    });

    it("reports a provider selection to the caller", async () => {
      const user = userEvent.setup();
      renderRow({ isSelectProviderDisabled: false });

      await user.click(
        screen.getByRole("button", { name: "Select a provider" }),
      );

      expect(onSelectProvider).toHaveBeenCalledTimes(1);
      expect(onAddAddress).not.toHaveBeenCalled();
    });

    it("disables both actions once the case is closed", async () => {
      const user = userEvent.setup();
      renderRow({ isClosed: true, isSelectProviderDisabled: false });

      const manual = screen.getByRole("button", {
        name: "Enter an address manually",
      });
      const provider = screen.getByRole("button", {
        name: "Select a provider",
      });
      expect(manual).toBeDisabled();
      expect(provider).toBeDisabled();

      await user.click(manual);
      await user.click(provider);
      expect(onAddAddress).not.toHaveBeenCalled();
      expect(onSelectProvider).not.toHaveBeenCalled();
    });
  });

  describe("with a manual street address", () => {
    it("shows the address and no entry actions", () => {
      // Setting an address closes the case, so there is nothing left to change.
      renderRow({ homePlan: manualAddressPlan });

      expect(screen.getByText("Address")).toBeInTheDocument();
      expect(screen.getByText("12 Example St, Boise, ID")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("exposes the full address as a title, for one truncated in the row", () => {
      renderRow({ homePlan: manualAddressPlan });

      expect(screen.getByText("12 Example St, Boise, ID")).toHaveAttribute(
        "title",
        "12 Example St, Boise, ID",
      );
    });

    it("omits the title when there is no address to show", () => {
      renderRow({
        homePlan: { ...manualAddressPlan, address: null } as HomePlan,
      });

      expect(screen.getByText("Address")).toBeInTheDocument();
    });
  });

  describe("with a provider home plan", () => {
    it("shows the provider, its contact details and status", () => {
      renderRow({ homePlan: providerPlan });

      expect(screen.getByText("Example House")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("jane.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("208-555-0100")).toBeInTheDocument();
      expect(screen.getByText(/Updated at/)).toBeInTheDocument();
    });

    it.each([
      ["Copy name", "Jane Doe"],
      ["Copy email", "jane.doe@example.com"],
      ["Copy phone", "208-555-0100"],
    ])("copies via the %s button", async (label, expected) => {
      const user = userEvent.setup();
      renderRow({ homePlan: providerPlan });

      await user.click(screen.getByRole("button", { name: label }));

      expect(onCopy).toHaveBeenCalledWith(expected);
    });

    it.each([
      ["contactName", "Copy name"],
      ["email", "Copy email"],
      ["contactPhone", "Copy phone"],
    ])("hides the copy button when %s is missing", (field, label) => {
      const { provider } = providerPlan as unknown as {
        provider: { contact: object };
      };

      renderRow({
        homePlan: {
          ...providerPlan,
          provider: {
            ...provider,
            contact: { ...provider.contact, [field]: null },
          },
        } as unknown as HomePlan,
      });

      expect(
        screen.queryByRole("button", { name: label }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Copy / })).toHaveLength(2);
    });

    it("renders the contact rows empty for a provider with no users", () => {
      renderRow({
        homePlan: {
          ...providerPlan,
          provider: {
            ...(providerPlan as unknown as { provider: object }).provider,
            contact: null,
          },
        } as unknown as HomePlan,
      });

      expect(screen.getByText("Example House")).toBeInTheDocument();
      expect(screen.getByText("Contact name")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Copy / }),
      ).not.toBeInTheDocument();
    });

    it("reports a missing provider rather than rendering an empty card", () => {
      renderRow({
        homePlan: { ...providerPlan, provider: null } as unknown as HomePlan,
      });

      expect(
        screen.getByText("Could not fetch provider details"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Example House")).not.toBeInTheDocument();
    });

    it("has no accessibility violations", async () => {
      const { container } = renderRow({ homePlan: providerPlan });

      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
