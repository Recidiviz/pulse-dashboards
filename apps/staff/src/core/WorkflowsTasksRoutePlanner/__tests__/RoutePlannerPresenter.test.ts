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

import { RootStore } from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore";
import UserStore from "../../../RootStore/UserStore";
import { Client, WorkflowsStore } from "../../../WorkflowsStore";
import { SearchStore } from "../../../WorkflowsStore/SearchStore";
import RoutePlannerClientStore from "../ClientStore/ClientStoreBase";
import { RoutePlannerPresenter } from "../RoutePlannerPresenter";

const mockTenantStore = {
  currentTenantId: vi.fn(),
} as any as TenantStore;

const mockUserStore = {
  activeFeatureVariants: vi.fn() as any,
  userEmail: "test@test.com",
} as any as UserStore;

const mockSearchStore = {
  selectedSearchIds: vi.fn() as any,
} as any as SearchStore;

const mockWorkflowsStore = {
  rootStore: {
    tenantStore: mockTenantStore,
    userStore: mockUserStore,
    currentTenantId: undefined,
  } as unknown as RootStore,
  searchStore: mockSearchStore,
} as any as WorkflowsStore;

let rpPresenter: RoutePlannerPresenter;
let rpClientStore: RoutePlannerClientStore;

afterEach(() => {
  vi.resetAllMocks();
});

const clients = [
  {
    displayName: "test123Name",
    pseudonymizedId: "test123",
    formattedAddress: "test123",
    externalId: "test123Id",
    supervisionLevel: "medium",
  },
  {
    displayName: "test456Name",
    pseudonymizedId: "test456",
    formattedAddress: "test456",
    externalId: "test456Id",
    supervisionLevel: "low",
  },
  {
    displayName: "test789Name",
    pseudonymizedId: "test789",
    formattedAddress: "test789",
    externalId: "high",
  },
] as Client[];

describe("Selected clients pii only gets sent out if FV HCRPPIIEmail is true", () => {
  beforeEach(() => {
    vi.spyOn(
      mockWorkflowsStore.rootStore,
      "currentTenantId",
      "get",
    ).mockReturnValue("US_ID");
  });

  describe("when the user has the FV", () => {
    beforeEach(() => {
      vi.spyOn(
        mockWorkflowsStore.rootStore.userStore,
        "activeFeatureVariants",
        "get",
      ).mockReturnValue({ HCRPPIIEmail: {} });

      rpClientStore = new RoutePlannerClientStore(mockWorkflowsStore);
      rpPresenter = new RoutePlannerPresenter(
        mockWorkflowsStore,
        rpClientStore,
      );
      for (const client of clients) {
        rpClientStore.addSelectedPerson(client);
      }
    });

    it("sends selected clients to approved users", () => {
      rpClientStore.removeFromAllPeople(clients[clients.length - 1]);

      const emailBody = rpPresenter.mapDirectionsBody?.emailBody;

      // displays correct list from selected individuals
      expect(emailBody).toContain(clients[0].externalId);
      expect(emailBody).toContain(clients[1].displayName);
      expect(emailBody).not.toContain(clients[2].externalId);
    });
  });

  describe("Does not send selected clients list to users without FV", () => {
    beforeEach(() => {
      vi.spyOn(
        mockWorkflowsStore.rootStore.userStore,
        "activeFeatureVariants",
        "get",
      ).mockReturnValue({});

      rpClientStore = new RoutePlannerClientStore(mockWorkflowsStore);
      rpPresenter = new RoutePlannerPresenter(
        mockWorkflowsStore,
        rpClientStore,
      );
      for (const client of clients) {
        rpClientStore.addSelectedPerson(client);
      }
    });

    it("does not send the selected clients list to users", () => {
      const emailBody = rpPresenter.mapDirectionsBody?.emailBody;

      // the map body will not include any pii for selected clients
      expect(emailBody).not.toContain(clients[1].externalId);
      expect(emailBody).not.toContain(clients[0].displayName);

      // the google maps link should still be sent out
      expect(emailBody).toContain("Here is the Google Maps link");
    });
  });
});

const maliciousClients = [
  {
    displayName: `<script>alert('xss-name')</script>Malicious Actor`,
    pseudonymizedId: "xss1",
    formattedAddress: `<img src=x onerror=alert('xss-address')>123 Evil St`,
    externalId: `<script>alert('xss-id')</script>id123`,
    supervisionLevel: `<svg onload=alert('xss-level')>medium</svg>`,
    /*eslint no-script-url: "off"*/
    phoneNumberUri: `javascript:alert('xss-uri')`,
    phoneNumber: `555-0100`,
    addressNotes: `<svg onload=alert('xss-notes')>Gate code 1234</svg>`,
  },
  {
    displayName: `<a href="test" onclick="alert('xss-click')">Second Person</a>`,
    pseudonymizedId: "xss2",
    formattedAddress: "456 Safe Ave",
    externalId: "id456",
    supervisionLevel: "low",
  },
] as Client[];

describe("selectedClientsInformation sanitizes XSS payloads", () => {
  beforeEach(() => {
    vi.spyOn(
      mockWorkflowsStore.rootStore,
      "currentTenantId",
      "get",
    ).mockReturnValue("US_TX");
    vi.spyOn(
      mockWorkflowsStore.rootStore.userStore,
      "activeFeatureVariants",
      "get",
    ).mockReturnValue({ HCRPPIIEmail: {} });

    rpClientStore = new RoutePlannerClientStore(mockWorkflowsStore);
    rpPresenter = new RoutePlannerPresenter(mockWorkflowsStore, rpClientStore);

    // @ts-ignore
    mockWorkflowsStore.searchStore.selectedSearchIds = [];
    for (const client of maliciousClients) {
      rpClientStore.addSelectedPerson(client);
    }
  });

  it("neutralizes script tags as inert escaped text", () => {
    const info = rpPresenter.mapDirectionsBody?.emailBody;

    // no live "<script" tag makes it into the output
    expect(info).not.toContain("<script");
    // React escapes the tag into inert text rather than removing it, so the
    // payload is still visible, just no longer parseable as markup
    expect(info).toContain("&lt;script&gt;");
    expect(info).toContain("&lt;/script&gt;");
    // safe text alongside the neutralized payload is preserved
    expect(info).toContain("Malicious Actor");
    expect(info).toContain("id123");
  });

  it("neutralizes inline event handler markup as inert escaped text rather than stripping it", () => {
    const info = rpPresenter.mapDirectionsBody?.emailBody;

    // no live "<img"/"<svg"/onclick-bearing anchor tag makes it into the output
    expect(info).not.toContain("<img");
    expect(info).not.toContain("<svg");
    expect(info).not.toContain('<a href="test"');
    // the markup, including the event handler text, survives only as escaped
    // text rather than being parsed as real tags/attributes
    expect(info).toContain("&lt;img src=x onerror=alert('xss-address')&gt;");
    expect(info).toContain("&lt;svg onload=alert('xss-level')&gt;");
    expect(info).toContain("&lt;svg onload=alert('xss-notes')&gt;");
    expect(info).toContain(
      '&lt;a href="test" onclick="alert(\'xss-click\')"&gt;',
    );
    // surrounding safe content still renders
    expect(info).toContain("123 Evil St");
    expect(info).toContain("Second Person");
  });

  it("strips dangerous javascript: URIs from links entirely", () => {
    const info = rpPresenter.mapDirectionsBody?.emailBody;

    expect(info).not.toContain("javascript:");
    expect(info).not.toContain("alert('xss-uri')");
    // the safe phone number text still renders even though the link is gone
    expect(info).toContain("555-0100");
  });

  it("still renders benign client information untouched", () => {
    const info = rpPresenter.mapDirectionsBody?.emailBody;

    expect(info).toContain("456 Safe Ave");
    expect(info).toContain("id456");
    expect(info).toContain("low");
  });
});
