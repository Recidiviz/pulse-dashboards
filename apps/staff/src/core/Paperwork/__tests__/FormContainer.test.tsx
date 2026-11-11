// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { configure } from "mobx";
import { BrowserRouter } from "react-router-dom";
import { Mock } from "vitest";

import { palette } from "~design-system";

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider/StoreProvider";
import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { Client } from "../../../WorkflowsStore/Client";
import { FormBase } from "../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityBase } from "../../../WorkflowsStore/Opportunity/OpportunityBase";
import { FormContainer, FormHeaderProps } from "../FormContainer";

vi.mock("../../../components/StoreProvider/StoreProvider", () => ({
  useFeatureVariants: vi.fn(),
  useRootStore: vi.fn(),
}));

class TestOpportunity extends OpportunityBase<Client, Record<string, any>> {}
let rootStore: RootStore;
let opp: OpportunityBase<any, any>;
let client: Client;
let form: FormBase<any>;

function setup(
  props: Partial<FormHeaderProps> = {},
  { supervisorReviewChain = false } = {},
) {
  rootStore = new RootStore();
  rootStore.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  (useFeatureVariants as Mock).mockReturnValue({
    formRevertButton: {},
  });
  (useRootStore as Mock).mockReturnValue({
    workflowsStore: rootStore.workflowsStore,
  });
  rootStore.userStore = {
    isRecidivizUser: false,
    activeFeatureVariants: { formRevertButton: {} },
  } as UserStore;
  client = {
    pseudonymizedId: "TEST123",
    rootStore,
    recordId: "us_id_001",
  } as Client;
  opp = new TestOpportunity(client, "LSU", rootStore, {});
  vi.spyOn(opp, "hydrationState", "get").mockReturnValue({
    status: "hydrated",
  });
  form = new FormBase<any>(opp, rootStore);
  opp.form = form;
  vi.spyOn(opp.config, "enableSupervisorReviewChain", "get").mockReturnValue(
    supervisorReviewChain,
  );

  const defaultFormContainerProps: FormHeaderProps = {
    agencyName: "Salty Spittoon",
    dataProviso:
      "If this form is not approved by tomorrow, please redirect future applications to the Weenie Hut Jr. <3",
    heading: "Degrassi High School Application",
    isMissingContent: false,
    onClickDownload: vi.fn(),
    downloadButtonLabel: "Download Form",
    opportunity: opp,
    children: undefined,
  };

  return render(
    <BrowserRouter>
      <FormContainer {...defaultFormContainerProps} {...props} />
    </BrowserRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  configure({ safeDescriptors: false });
});

afterEach(() => {
  vi.useRealTimers();
  configure({ safeDescriptors: true });
});

describe("FormContainer", () => {
  it("renders without crashing", () => {
    setup();
    expect(screen).toBeDefined();
  });
});

describe("FormContainer actions menu", () => {
  it("puts the form's actions in a menu when the form has a supervisor review chain", () => {
    setup({}, { supervisorReviewChain: true });

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(
      screen.getByRole("menuitem", { name: "Send Back for Revisions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Download Form" }),
    ).toBeInTheDocument();
  });

  it("shows the form's actions as buttons when the form has no supervisor review chain", () => {
    const { container } = setup();

    expect(container.querySelector('[aria-haspopup="menu"]')).toBeNull();
    expect(
      screen.getByRole("button", { name: "Download Form" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revert All Edits" }),
    ).toBeInTheDocument();
  });

  it("shows keyboard focus on the More actions button", () => {
    setup({ menuActions: [{ label: "Print", onClick: vi.fn() }] });

    expect(
      screen.getByRole("button", { name: "More actions" }),
    ).toHaveStyleRule("outline", `2px solid ${palette.white70}`, {
      modifier: ":focus-visible",
    });
  });

  it("moves Revert All Edits into the menu when the form passes menu actions", () => {
    setup({ menuActions: [{ label: "Print", onClick: vi.fn() }] });

    expect(
      screen.queryByRole("button", { name: "Revert All Edits" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.getByRole("menuitem", { name: "Revert All Edits" }),
    ).toBeInTheDocument();
  });

  it("puts menu actions the form passes in a menu without a supervisor review chain", () => {
    const print = vi.fn();
    setup({ menuActions: [{ label: "Print", onClick: print }] });

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Print" }));

    expect(print).toHaveBeenCalledOnce();
  });

  it("adds menu actions the form passes to the supervisor review chain's menu", () => {
    setup(
      { menuActions: [{ label: "Print", onClick: vi.fn() }] },
      { supervisorReviewChain: true },
    );

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.getByRole("menuitem", { name: "Print" })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Send Back for Revisions" }),
    ).toBeInTheDocument();
  });
});

describe("FormContainer printing", () => {
  it("prints the heading in dark text and leaves the header's actions off a printable form", () => {
    setup({
      printable: true,
      menuActions: [{ label: "Print", onClick: vi.fn() }],
    });

    expect(
      screen.getByText("Degrassi High School Application"),
    ).toHaveStyleRule("color", palette.pine1, { media: "print" });
    expect(screen.getByRole("group", { name: "Form actions" })).toHaveStyleRule(
      "display",
      "none",
      { media: "print" },
    );
  });

  it("drops the dark backgrounds from a printable form, even with background graphics on", () => {
    const { container } = setup({ printable: true });

    expect(container.firstChild).toHaveStyleRule("background", "none", {
      media: "print",
    });
  });

  it("leaves a form's print styles alone unless it asks to be printable", () => {
    setup();

    expect(
      screen.getByText("Degrassi High School Application"),
    ).not.toHaveStyleRule("color", palette.pine1, { media: "print" });
  });
});

describe("FormContainer DownloadButton", () => {
  it("renders without crashing", async () => {
    setup();
    const QueriedDownloadButton = await screen.findByText("Download Form");
    expect(QueriedDownloadButton).toBeDefined();
  });

  it("renders without crashing and is disabled when isMissingContent is true", async () => {
    setup({ isMissingContent: true });
    // it should still render, the button should just be disabled is all
    const QueriedDownloadButton = await screen.findByText(
      "Download Unavailable",
    );
    expect(QueriedDownloadButton).toBeDefined();
  });

  it("hides the download button when hideDownloadButton is true", () => {
    setup({ hideDownloadButton: true });
    expect(screen.queryByText("Download Form")).not.toBeInTheDocument();
  });
});
