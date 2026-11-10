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
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import {
  buildIdahoTHStore,
  renderWithStore,
} from "../../../../../test/renderWithStore";
import { TAB_IDS } from "../../../constants";
import { StaffApprovalsView } from "../StaffApprovalsView";

const mocks = vi.hoisted(() => ({
  setDecision: vi.fn(),
  staffApplicationById: vi.fn(),
  staffHomePlan: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

vi.mock("~@idaho-th/client/hooks/housingApplication", () => ({
  useSetParoleCommissionDecision: () => ({
    mutate: mocks.setDecision,
    isPending: false,
  }),
  useStaffHomePlan: () => mocks.staffHomePlan(),
}));

vi.mock("~@idaho-th/client/hooks/useApplicationDetail", () => ({
  useStaffApplicationById: () => mocks.staffApplicationById(),
}));

vi.mock("../../../UpdateReleaseDateModal", () => ({
  UpdateReleaseDateModal: () => null,
}));

vi.mock("../../../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

const APPLICATION_ID = "app-1";

function givenCase({
  stage = APPLICATION_STAGE.APPLICATION,
  paroleCommissionDecision = null,
  homePlanInvestigation = null,
  hasHomePlan = false,
}: {
  stage?: string;
  paroleCommissionDecision?: string | null;
  homePlanInvestigation?: string | null;
  hasHomePlan?: boolean;
} = {}) {
  mocks.staffApplicationById.mockReturnValue({
    data: { stage, paroleCommissionDecision },
  });
  mocks.staffHomePlan.mockReturnValue({
    data: {
      homePlan: hasHomePlan ? { type: "PROVIDER" } : null,
      approvals: hasHomePlan ? { homePlanInvestigation } : null,
    },
  });
}

function renderView() {
  const store = buildIdahoTHStore({ currentApplicationId: APPLICATION_ID });
  return renderWithStore(<StaffApprovalsView />, { store });
}

async function chooseAndSave(label: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("radio", { name: label }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  givenCase();
});

describe("StaffApprovalsView", () => {
  it("offers the three Parole Commission outcomes", () => {
    renderView();

    expect(screen.getByText("Parole Commission Decision")).toBeInTheDocument();
    expect(
      screen.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ).toEqual(["PAROLE_GRANTED", "PAROLE_DENIED", "NOT_APPLICABLE"]);
  });

  it("saves a decision before any home plan exists, with no confirmation", async () => {
    renderView();

    await chooseAndSave("Parole granted");

    expect(mocks.setDecision).toHaveBeenCalledWith(
      { applicationId: APPLICATION_ID, decision: "PAROLE_GRANTED" },
      expect.any(Object),
    );
  });

  it("confirms before Parole denied closes the case", async () => {
    renderView();

    const user = await chooseAndSave("Parole denied");

    expect(mocks.setDecision).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    );
    expect(mocks.setDecision).toHaveBeenCalledWith(
      { applicationId: APPLICATION_ID, decision: "PAROLE_DENIED" },
      expect.any(Object),
    );
  });

  it("confirms before a decision that advances the case to Release", async () => {
    givenCase({
      stage: APPLICATION_STAGE.APPROVALS,
      hasHomePlan: true,
      homePlanInvestigation: "APPROVED",
    });
    renderView();

    await chooseAndSave("Not applicable (sentence fully served)");

    expect(mocks.setDecision).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Advance to Release" }),
    ).toBeInTheDocument();
  });

  it("switches to the Home Plan tab to prompt for a release date after advancing", async () => {
    givenCase({
      stage: APPLICATION_STAGE.APPROVALS,
      hasHomePlan: true,
      homePlanInvestigation: "APPROVED",
    });
    mocks.setDecision.mockImplementation((_input, { onSuccess }) =>
      onSuccess(),
    );
    const store = buildIdahoTHStore({ currentApplicationId: APPLICATION_ID });
    renderWithStore(<StaffApprovalsView />, { store });

    const user = await chooseAndSave("Parole granted");
    await user.click(
      screen.getByRole("button", { name: "Advance to Release" }),
    );

    expect(store.previewModalStore.activeTab).toBe(TAB_IDS.HOME_PLAN);
    expect(store.previewModalStore.homePlanModal).toEqual({
      type: "updateReleaseDate",
    });
  });

  it("lets a saved decision change, with no badge until it is locked", () => {
    givenCase({
      stage: APPLICATION_STAGE.APPROVALS,
      paroleCommissionDecision: "PAROLE_GRANTED",
    });
    renderView();

    expect(screen.queryByText("Parole Granted")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Parole granted" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Parole denied" })).toBeEnabled();
  });

  it.each([APPLICATION_STAGE.RELEASE, APPLICATION_STAGE.CLOSED])(
    "shows only the decision badge once the case is %s",
    (stage) => {
      givenCase({ stage, paroleCommissionDecision: "PAROLE_GRANTED" });
      renderView();

      expect(screen.getByText("Parole Granted")).toBeInTheDocument();
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      expect(
        screen.queryByRole("button", { name: "Save" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("NEXT STEP")).not.toBeInTheDocument();
    },
  );

  it("frames the decision only in the Approvals stage", () => {
    renderView();
    expect(screen.queryByText("CURRENT STEP")).not.toBeInTheDocument();
  });

  it("marks the decision as the current step in Approvals until it is saved", () => {
    givenCase({ stage: APPLICATION_STAGE.APPROVALS });
    renderView();
    expect(screen.getByText("CURRENT STEP")).toBeInTheDocument();
  });
});
