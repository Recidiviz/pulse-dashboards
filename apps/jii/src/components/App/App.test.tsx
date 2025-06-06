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

import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { configure } from "mobx";
import { MemoryRouter } from "react-router-dom";
import { MockInstance } from "vitest";

import { AuthClient } from "~auth";
import { usMeResidents } from "~datatypes";

import { residentsConfigByState } from "../../configs/residentsConfig";
import { stateConfigsByStateCode } from "../../configs/stateConstants";
import { ComparisonPageConfig, OpportunityConfig } from "../../configs/types";
import { usMeProgressModuleConfig } from "../../configs/US_ME/progress/config";
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
        await screen.findByRole("button", {
          name: "Staff login",
        }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("button", {
        name: "Staff login",
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

  const residentFixture = usMeResidents[0];

  const personPseudoId = residentFixture.pseudonymizedId;

  beforeEach(() => {
    rootStore = new RootStore();
    vi.spyOn(hooks, "useRootStore").mockReturnValue(rootStore);

    vi.spyOn(
      rootStore.userStore.authManager,
      "authState",
      "get",
    ).mockReturnValue({
      status: "authorized",
      userProfile: {
        stateCode: "US_ME",
        externalId: residentFixture.personExternalId,
        pseudonymizedId: personPseudoId,
      },
    });
  });

  describe("search page", () => {
    beforeEach(() => {
      vi.spyOn(
        rootStore.userStore.authManager,
        "authState",
        "get",
      ).mockReturnValue({
        status: "authorized",
        userProfile: {
          stateCode: "US_ME",
          permissions: ["enhanced"],
        },
      });

      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Search.buildPath({
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

  it("root should redirect to homepage", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Your Progress",
        level: 2,
      }),
    ).toBeInTheDocument();
  });

  it("state root should redirect to homepage", async () => {
    render(
      <MemoryRouter
        initialEntries={[routes.State.buildPath({ stateSlug: "maine" })]}
      >
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Your Progress",
        level: 2,
      }),
    ).toBeInTheDocument();
  });

  const sccpConfig = residentsConfigByState.US_ME.eligibility
    ?.incarcerationOpportunities.usMeSCCP as OpportunityConfig;

  describe("homepage", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Resident.buildPath({
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
              personPseudoId,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      expect(
        await screen.findByRole("heading", {
          level: 2,
          name: "Your Progress",
        }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        level: 2,
        name: "Your Progress",
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set the page title", () => {
      expect(window.document.title).toBe(`Home – Opportunities`);
    });
  });

  describe("calculating dates page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Resident.Progress.InfoPage.buildPath({
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
              personPseudoId,
              pageSlug: usMeProgressModuleConfig.progressPage.urlSlug,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: usMeProgressModuleConfig.progressPage.heading,
        }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        level: 1,
        name: usMeProgressModuleConfig.progressPage.heading,
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set the page title", () => {
      expect(window.document.title).toBe(
        `${usMeProgressModuleConfig.progressPage.heading} – Opportunities`,
      );
    });
  });

  describe("opportunity page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Resident.Eligibility.Opportunity.buildPath({
              opportunitySlug: sccpConfig.urlSlug,
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
              personPseudoId,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      expect(
        await screen.findByRole("heading", {
          name: residentsConfigByState.US_ME.eligibility
            ?.incarcerationOpportunities.usMeSCCP?.name,
          level: 1,
        }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        name: residentsConfigByState.US_ME.eligibility
          ?.incarcerationOpportunities.usMeSCCP?.name,
        level: 1,
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toBe(`${sccpConfig.name} – Opportunities`);
    });
  });

  describe("opportunity requirements page", () => {
    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Resident.Eligibility.Opportunity.InfoPage.buildPath({
              opportunitySlug: sccpConfig.urlSlug,
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
              personPseudoId,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              pageSlug: sccpConfig.requirements.fullPage!.urlSlug,
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
            name: sccpConfig.requirements.fullPage?.heading,
          }),
        ).toBeInTheDocument(),
      );
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        name: sccpConfig.requirements.fullPage?.heading,
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toBe(
        `${sccpConfig.requirements.fullPage?.heading} – Opportunities`,
      );
    });
  });

  describe.each(sccpConfig.sections.map((s) => s.fullPage))(
    "opportunity info page: $urlSlug",
    (pageConfig) => {
      beforeEach(() => {
        container = render(
          <MemoryRouter
            initialEntries={[
              routes.State.Resident.Eligibility.Opportunity.InfoPage.buildPath({
                opportunitySlug: "sccp",
                stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
                pageSlug: pageConfig.urlSlug,
                personPseudoId,
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
              name: pageConfig.heading,
            }),
          ).toBeInTheDocument(),
        );
      });

      it("should be accessible", async () => {
        await screen.findByRole("heading", {
          name: pageConfig.heading,
        });

        expect(await axe(container)).toHaveNoViolations();
      });

      it("should set page title", () => {
        expect(window.document.title).toBe(
          `${pageConfig.heading} – Opportunities`,
        );
      });
    },
  );

  describe("opportunity comparison page", () => {
    const comparisonConfig = residentsConfigByState.US_ME.eligibility
      ?.comparisons?.[0] as ComparisonPageConfig;

    beforeEach(() => {
      container = render(
        <MemoryRouter
          initialEntries={[
            routes.State.Resident.Eligibility.Comparison.buildPath({
              stateSlug: stateConfigsByStateCode.US_ME.urlSlug,
              personPseudoId,
              opportunitySlug1: sccpConfig.urlSlug,
              opportunitySlug2:
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                residentsConfigByState.US_ME.eligibility!
                  .incarcerationOpportunities.usMeWorkRelease!.urlSlug,
            }),
          ]}
        >
          <App />
        </MemoryRouter>,
      ).container;
    });

    it("should render", async () => {
      expect(
        await screen.findByRole("heading", {
          name: comparisonConfig.fullPage.heading,
          level: 1,
        }),
      ).toBeInTheDocument();
    });

    it("should be accessible", async () => {
      await screen.findByRole("heading", {
        name: comparisonConfig.fullPage.heading,
        level: 1,
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it("should set page title", () => {
      expect(window.document.title).toBe(
        `${comparisonConfig.fullPage.heading} – Opportunities`,
      );
    });
  });
});
