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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { configure } from "mobx";
import { MemoryRouter } from "react-router-dom";
import { MockInstance } from "vitest";

import { AuthClient } from "~auth";
import { outputFixture, usMeResidents } from "~datatypes";

import { stateConfigsByStateCode } from "../../configs/stateConstants";
import { RootStore } from "../../datastores/RootStore";
import * as routes from "../../routes/routes";
import * as hooks from "../StoreProvider/useRootStore";
import { App } from "./App";

let container: HTMLElement;

beforeEach(() => {
  expect.hasAssertions();
  configure({ safeDescriptors: false });
});

afterEach(() => {
  configure({ safeDescriptors: true });
});

describe("public routes", () => {
  beforeEach(() => {
    vi.spyOn(AuthClient.prototype, "isAuthorized", "get").mockReturnValue(
      false,
    );
  });

  describe("state selection page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      expect(
        await screen.findByRole("combobox", {
          name: "Find opportunities in the state where you’re incarcerated",
        }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("combobox", {
        name: "Find opportunities in the state where you’re incarcerated",
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toMatchInlineSnapshot(`"Opportunities"`);
    });
  });

  describe("state landing page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[routes.State.buildPath({ stateSlug: "maine" })]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      expect(
        await screen.findByRole("combobox", {
          name: "Select your facility to log in to Opportunities",
        }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("combobox", {
        name: "Select your facility to log in to Opportunities",
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toMatchInlineSnapshot(
        `"Maine – Opportunities"`,
      );
    });
  });

  describe("email verification page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter initialEntries={[routes.EmailVerification.buildPath({})]}>
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", () => {
      expect(
        screen.getByRole("heading", { name: "Please verify your email" }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", { name: "Please verify your email" });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set the page title", () => {
      expect(document.title).toMatchInlineSnapshot(
        `"Verify your email – Opportunities"`,
      );
    });
  });

  describe("after login page", () => {
    let spy: MockInstance;

    beforeEach(() => {
      spy = vi
        .spyOn(AuthClient.prototype, "handleRedirectFromLogin")
        .mockResolvedValue(undefined);

      container = render(
        <MemoryRouter initialEntries={[routes.AfterLogin.buildPath({})]}>
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", () => {
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
      expect(spy).toHaveBeenCalled();
    });

    it("should be accessible", async () => {
      await screen.findByText("Loading data...");

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set the page title", () => {
      expect(document.title).toMatchInlineSnapshot(`"Opportunities"`);
    });
  });
});

describe("protected routes", () => {
  let rootStore: RootStore;

  const residentFixture = outputFixture(usMeResidents[0]);

  beforeEach(() => {
    rootStore = new RootStore();
    vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);

    vi.spyOn(
      rootStore.userStore.authClient,
      "appMetadata",
      "get",
    ).mockReturnValue({
      stateCode: "US_ME",
      externalId: residentFixture.personExternalId,
      pseudonymizedId: residentFixture.pseudonymizedId,
      intercomUserHash: "abc123",
    });
  });

  describe("search page", () => {
    beforeEach(() => {
      vi.spyOn(
        rootStore.userStore.authClient,
        "appMetadata",
        "get",
      ).mockReturnValue({ stateCode: "US_ME", permissions: ["enhanced"] });

      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Eligibility.Search.buildPath({
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      expect(await screen.findByText("Look up a resident")).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByText("Look up a resident");

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set the page title", () => {
      expect(document.title).toMatchInlineSnapshot(`"Search – Opportunities"`);
    });
  });

  it("root should redirect to default opportunity", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("You could be eligible for release onto SCCP", {
          exact: false,
        }),
      ).toBeInTheDocument(),
    );
  });

  it("state root should redirect to default opportunity", async () => {
    render(
      <MemoryRouter
        initialEntries={[routes.State.buildPath({ stateSlug: "maine" })]}
      >
        <App />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("You could be eligible for release onto SCCP", {
          exact: false,
        }),
      ).toBeInTheDocument(),
    );
  });

  describe("SCCP page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Eligibility.Opportunity.buildPath({
              opportunitySlug: "sccp",
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      await waitFor(() =>
        expect(
          screen.getByText("You could be eligible for release onto SCCP", {
            exact: false,
          }),
        ).toBeInTheDocument(),
      );
    });

    it("should be accessible", async () => {
      await screen.findByText("You could be eligible for release onto SCCP", {
        exact: false,
      });

      expect(await axe(container)).toHaveNoViolations();

      fireEvent.click(
        screen.getByRole("button", { name: "application packet" }),
      );

      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "SCCP Application" }),
        ).toBeVisible(),
      );

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toMatchInlineSnapshot(
        `"Supervised Community Confinement Program – Opportunities"`,
      );
    });
  });

  describe("SCCP about page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Eligibility.Opportunity.About.buildPath({
              opportunitySlug: "sccp",
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      await waitFor(() =>
        expect(
          screen.getByRole("heading", {
            name: "About the Supervised Community Confinement Program (SCCP)",
          }),
        ).toBeInTheDocument(),
      );
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        name: "About the Supervised Community Confinement Program (SCCP)",
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toMatchInlineSnapshot(
        `"About the Supervised Community Confinement Program (SCCP) – Opportunities"`,
      );
    });
  });

  describe("SCCP requirements page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Eligibility.Opportunity.Requirements.buildPath({
              opportunitySlug: "sccp",
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      await waitFor(() =>
        expect(
          screen.getByRole("heading", {
            name: "SCCP Eligibility Requirements",
          }),
        ).toBeInTheDocument(),
      );
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        name: "SCCP Eligibility Requirements",
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toMatchInlineSnapshot(
        `"SCCP Eligibility Requirements – Opportunities"`,
      );
    });
  });

  describe("SCCP next steps page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Eligibility.Opportunity.NextSteps.buildPath({
              opportunitySlug: "sccp",
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      await waitFor(() =>
        expect(
          screen.getByRole("heading", {
            name: "SCCP Application and Tips",
          }),
        ).toBeInTheDocument(),
      );
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        name: "SCCP Application and Tips",
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toMatchInlineSnapshot(
        `"SCCP Application and Tips – Opportunities"`,
      );
    });
  });
});
