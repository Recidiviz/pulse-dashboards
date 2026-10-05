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

import { beforeEach, describe, expect, test } from "vitest";

import { RootStore } from "../../../RootStore";
import { Client } from "../../Client";
import { Resident } from "../../Resident";
import {
  type OpportunityHit,
  personShellFromHit,
  recordIdOf,
} from "../personShells";

let root: RootStore;

beforeEach(() => {
  root = new RootStore();
});

/**
 * Shaped from a real hit off the offline node, including the nesting.
 * Typesense returns a nested object, not dotted keys, and the parser depends
 * on which it is.
 */
const RESIDENT_HIT: OpportunityHit = {
  id: "us_ne_RES006_usNeGoodTimeRestoration",
  externalId: "RES006",
  stateCode: "US_NE",
  opportunityType: "usNeGoodTimeRestoration",
  isEligible: false,
  isAlmostEligible: true,
  locationId: "DEMOFACILITY",
  residentDocId: "us_ne_RES006",
  residents: {
    displayId: "RES006",
    personName: { givenNames: "Christopher", surname: "Davis" },
    pseudonymizedId: "anonres006-ne",
  },
};

const CLIENT_HIT: OpportunityHit = {
  id: "us_tn_205_usTnExpiration",
  externalId: "205",
  stateCode: "US_TN",
  opportunityType: "usTnExpiration",
  isEligible: true,
  isAlmostEligible: false,
  officerId: "OFFICER1",
  clientDocId: "us_tn_205",
  clients: {
    displayId: "d205",
    personName: { givenNames: "Alex", surname: "Rivera" },
    pseudonymizedId: "anon205-tn",
    preferredName: "Al",
  },
};

describe("recordIdOf", () => {
  test("reads whichever reference resolved", () => {
    expect(recordIdOf(CLIENT_HIT)).toBe("us_tn_205");
    expect(recordIdOf(RESIDENT_HIT)).toBe("us_ne_RES006");
  });

  test("is undefined when neither did", () => {
    expect(recordIdOf({ stateCode: "US_TN" })).toBeUndefined();
  });
});

describe("the shell", () => {
  test("builds a Client from the nested clients object", () => {
    const shell = personShellFromHit(CLIENT_HIT, ["usTnExpiration"], root);

    expect(shell).toBeInstanceOf(Client);
    expect(shell?.recordId).toBe("us_tn_205");
    expect(shell?.pseudonymizedId).toBe("anon205-tn");
    expect(shell?.displayId).toBe("d205");
    expect(shell?.fullName).toEqual({
      givenNames: "Alex",
      surname: "Rivera",
    });
  });

  test("builds a Resident from the nested residents object", () => {
    const shell = personShellFromHit(
      RESIDENT_HIT,
      ["usNeGoodTimeRestoration"],
      root,
    );

    expect(shell).toBeInstanceOf(Resident);
    expect(shell?.recordId).toBe("us_ne_RES006");
    // `locationId` is the facility on this side. See personShells.
    expect((shell as Resident).facilityId).toBe("DEMOFACILITY");
  });

  test("takes stateCode and externalId from the OPPORTUNITY, not the person", () => {
    // The projection omits both from the nested person on purpose.
    const shell = personShellFromHit(CLIENT_HIT, [], root);

    expect(shell?.stateCode).toBe("US_TN");
    expect(shell?.externalId).toBe("205");
  });

  test("subscribes to nothing", () => {
    const shell = personShellFromHit(CLIENT_HIT, ["usTnExpiration"], root);

    expect(shell?.personUpdatesSubscription).toBeUndefined();
    expect(shell?.supervisionTasks).toBeUndefined();
  });

  test("resolves preferredName without a subscription", () => {
    const shell = personShellFromHit(CLIENT_HIT, ["usTnExpiration"], root);

    expect(shell?.preferredName).toBe("Al");
    // Woven into the full name, which is what proves the overlay reached the
    // accessor rather than merely being stored.
    expect(shell?.displayPreferredName).toBe("Alex (Al) Rivera");
  });

  test("reads an absent preferredName as none set, not as unloaded", () => {
    // RESIDENT_HIT carries no preferredName. "None set" and "not loaded" render
    // differently, and a shell never loads anything.
    const shell = personShellFromHit(RESIDENT_HIT, [], root);

    expect(shell?.preferredName).toBeUndefined();
    expect(shell?.displayPreferredName).toBe("Christopher Davis");
  });

  test("carries the caller's opportunity types, not the hit's", () => {
    // One hit names one type; the full set is known only across the result.
    const shell = personShellFromHit(
      CLIENT_HIT,
      ["usTnExpiration", "usTnCustodyLevelDowngrade"],
      root,
    );

    expect(shell?.record.allEligibleOpportunities).toEqual([
      "usTnExpiration",
      "usTnCustodyLevelDowngrade",
    ]);
  });
});

describe("refusing a hit it cannot name", () => {
  test("returns undefined when neither person object is present", () => {
    // An opportunity whose person merge found nobody. Building a shell with a
    // blank identity would put an unnamed row on the homepage.
    const { clients, ...withoutPerson } = CLIENT_HIT;

    expect(personShellFromHit(withoutPerson, [], root)).toBeUndefined();
  });

  test.each([
    ["pseudonymizedId", { pseudonymizedId: undefined }],
    ["displayId", { displayId: undefined }],
  ])("tolerates a missing %s only where it can fall back", (field, patch) => {
    const hit = {
      ...CLIENT_HIT,
      clients: { ...CLIENT_HIT.clients, ...patch },
    } as OpportunityHit;
    const shell = personShellFromHit(hit, [], root);

    // pseudonymizedId identifies the person in every URL and analytics event,
    // so its absence is fatal. displayId falls back to the external id.
    if (field === "pseudonymizedId") expect(shell).toBeUndefined();
    else expect(shell?.displayId).toBe("205");
  });

  test("returns undefined when the opportunity names no state", () => {
    const { stateCode, ...withoutState } = CLIENT_HIT;

    expect(personShellFromHit(withoutState, [], root)).toBeUndefined();
  });
});
