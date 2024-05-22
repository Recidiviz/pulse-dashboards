/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import { render, screen } from "@testing-library/react";
import { configure } from "mobx";
import { BrowserRouter } from "react-router-dom";
import { Mock } from "vitest";

import { useFeatureVariants } from "../../../components/StoreProvider/StoreProvider";
import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { Client } from "../../../WorkflowsStore/Client";
import { FormBase } from "../../../WorkflowsStore/Opportunity/Forms/FormBase";
import { OpportunityBase } from "../../../WorkflowsStore/Opportunity/OpportunityBase";
import { FormContainer, FormHeaderProps } from "../FormContainer";

vi.mock("../../../components/StoreProvider/StoreProvider", () => ({
  useFeatureVariants: vi.fn(),
}));

class TestOpportunity extends OpportunityBase<Client, Record<string, any>> {}
let rootStore: RootStore;
let opp: OpportunityBase<any, any>;
let client: Client;
let form: FormBase<any>;

function setup(props: Partial<FormHeaderProps> = {}) {
  rootStore = new RootStore();
  (useFeatureVariants as Mock).mockReturnValue({
    formRevertButton: {},
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
  opp = new TestOpportunity(client, "LSU", rootStore);
  vi.spyOn(opp, "hydrationState", "get").mockReturnValue({
    status: "hydrated",
  });
  form = new FormBase<any>(opp, rootStore);
  opp.form = form;

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
});
