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

// Builds a data-only Client or Resident from an opportunity hit.
//
// The person arrives NESTED inside the hit, so no second search and no
// client-side join are needed, and the shell subscribes to nothing.
//
// Shells exist only for FETCHED documents — the avatars and the acted-on set.
// Counts come from the tab census, which needs no person at all.

import type { OpportunityType } from "~datatypes";

import type { RootStore } from "../../RootStore";
import { Client } from "../Client";
import { Resident } from "../Resident";

/** A shell is a Client or a Resident; nothing else can be built from a hit. */
export type PersonWithOpportunities = Client | Resident;

/** The fields the projection puts on the nested person object. */
type NestedPerson = {
  personName?: { givenNames?: string; surname?: string };
  displayId?: string;
  pseudonymizedId?: string;
  preferredName?: string;
};

/** One opportunity hit, with its joins already projected in. */
export type OpportunityHit = Record<string, unknown> & {
  clients?: NestedPerson;
  residents?: NestedPerson;
};

function str(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * The person's own Typesense id, which is also the Firestore `recordId`.
 *
 * A person is a client or a resident and never both, so exactly one reference
 * resolves and the other dangles.
 */
export function recordIdOf(hit: OpportunityHit): string | undefined {
  return str(hit["clientDocId"]) ?? str(hit["residentDocId"]);
}

/** Which collection the person came from, or undefined if neither resolved. */
export function personCollectionOf(
  hit: OpportunityHit,
): "clients" | "residents" | undefined {
  if (hit.clients) return "clients";
  if (hit.residents) return "residents";
  return undefined;
}

/**
 * The shared identity fields, from the nested person plus the opportunity.
 *
 * `stateCode` and `personExternalId` are NOT on the nested person: the
 * opportunity carries both, and the person's id is composed from that pair.
 */
function baseRecord(hit: OpportunityHit, person: NestedPerson) {
  const recordId = recordIdOf(hit);
  if (!recordId) return undefined;

  const pseudonymizedId = str(person.pseudonymizedId);
  const stateCode = str(hit["stateCode"]);
  const personExternalId = str(hit["externalId"]);
  // A shell missing any of these cannot be addressed, linked to, or told apart
  // from another person. Refuse rather than build a broken one.
  if (!pseudonymizedId || !stateCode || !personExternalId) return undefined;

  return {
    recordId,
    stateCode,
    personExternalId,
    pseudonymizedId,
    displayId: str(person.displayId) ?? personExternalId,
    personName: {
      givenNames: person.personName?.givenNames,
      surname: person.personName?.surname,
    },
  };
}

/**
 * A data-only Client or Resident, or undefined when the hit cannot name one.
 *
 * `allEligibleOpportunities` is the caller's, not the hit's: it is the set of
 * types this person appeared under across the whole result, which one hit
 * cannot know.
 */
export function personShellFromHit(
  hit: OpportunityHit,
  allEligibleOpportunities: OpportunityType[],
  rootStore: RootStore,
): Client | Resident | undefined {
  const collection = personCollectionOf(hit);
  if (!collection) return undefined;

  const person = (collection === "clients" ? hit.clients : hit.residents) ?? {};
  const base = baseRecord(hit, person);
  if (!base) return undefined;

  const officerId = (str(hit["officerId"]) as string) ?? null;

  const shell =
    collection === "clients"
      ? new Client(
          {
            ...base,
            personType: "CLIENT",
            officerId,
            allEligibleOpportunities,
          },
          rootStore,
          { slim: true },
        )
      : new Resident(
          {
            ...base,
            personType: "RESIDENT",
            officerId,
            // `locationId` holds the person's location for whichever system
            // they belong to, so on this side it is the facility.
            facilityId: str(hit["locationId"]) ?? null,
            unitId: null,
            metadata: {},
            allEligibleOpportunities,
          },
          rootStore,
          undefined,
          { slim: true },
        );

  // `preferredName` is the only overlay field a shell needs: it is what
  // `displayPreferredName` reads.
  shell.injectUpdates(
    str(person.preferredName)
      ? { preferredName: person.preferredName }
      : undefined,
  );

  return shell;
}
