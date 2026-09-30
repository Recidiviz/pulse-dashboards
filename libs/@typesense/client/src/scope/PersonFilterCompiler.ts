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

// Compiles a person-doc scope into one Typesense filter_by per collection:
// clients, residents and opportunities. Separate filters because the three
// express the same grants under different field names, and only opportunities
// spans both systems.

import type {
  PersonScope,
  PersonScopeCollection,
  PersonScopeField,
  PerSystemScopes,
  SingleWorkflowsSystem,
} from "./types";
import { NEVER_MATCH_CLAUSE, quote, quoteList, withStateClause } from "./utils";

export class PersonFilterCompiler {
  /**
   * Which grant fields each collection can express, and under what NAME: a
   * district grant is `district` on `clients`, `locationId` on `opportunities`.
   * An absent entry DROPS the grant, and dropping narrows — never widens.
   */
  static readonly COLLECTION_FIELDS: Record<
    PersonScopeCollection,
    ReadonlyMap<PersonScopeField, string>
  > = {
    clients: new Map<PersonScopeField, string>([
      ["district", "district"],
      ["officerId", "officerId"],
    ]),
    // Residents carry no `district`; incarceration scoping is facility-shaped.
    // No state's INCARCERATION baseline is district-scoped today, so a district
    // grant never reaches this collection.
    residents: new Map<PersonScopeField, string>([["officerId", "officerId"]]),
    // `locationId` holds a district OR a facility, so the `system:=`
    // discriminator is load-bearing for CORRECTNESS: the two could collide as
    // strings. Denormalized rather than joined — see ../schemas.
    opportunities: new Map<PersonScopeField, string>([
      ["district", "locationId"],
      ["officerId", "officerId"],
    ]),
  };

  constructor(private readonly stateCode: string) {}

  compile(
    scopes: PerSystemScopes<PersonScope>,
  ): Partial<Record<PersonScopeCollection, string>> {
    const { supervision, incarceration } = scopes;
    const filters: Partial<Record<PersonScopeCollection, string>> = {};

    // Both person collections are single-system: no discriminator.
    if (supervision) {
      filters.clients = withStateClause(
        this.stateCode,
        this.predicateFor(supervision, "clients"),
      );
    }

    if (incarceration) {
      filters.residents = withStateClause(
        this.stateCode,
        this.predicateFor(incarceration, "residents"),
      );
    }

    if (supervision || incarceration) {
      filters.opportunities = this.mixedSystemFilter(scopes, "opportunities");
    }

    return filters;
  }

  /**
   * For a collection whose docs span both systems: each system's predicate,
   * discriminated by `system:=` and OR'd under the shared state clause.
   *
   * A system with no scope is OMITTED rather than left unbounded, so a
   * supervision-only user's key cannot reach an incarceration document.
   */
  private mixedSystemFilter(
    scopes: PerSystemScopes<PersonScope>,
    collection: PersonScopeCollection,
  ): string {
    const perSystem = (
      [
        ["SUPERVISION", scopes.supervision],
        ["INCARCERATION", scopes.incarceration],
      ] as const
    )
      .filter(
        (entry): entry is [SingleWorkflowsSystem, PersonScope] =>
          entry[1] !== undefined,
      )
      .map(([system, scope]) => {
        const predicate = this.predicateFor(scope, collection);
        // Every locationId clause sits inside its system's parentheses.
        return predicate === null
          ? `system:=${quote(system)}`
          : `(system:=${quote(system)} && (${predicate}))`;
      });

    const stateClause = `stateCode:=${quote(this.stateCode)}`;
    if (perSystem.length === 0) return stateClause;
    if (perSystem.length === 1) return `${stateClause} && ${perSystem[0]}`;
    return `${stateClause} && (${perSystem.join(" || ")})`;
  }

  private predicateFor(
    scope: PersonScope,
    collection: PersonScopeCollection,
  ): string | null {
    if (scope.grants.some((grant) => grant.kind === "unrestricted"))
      return null;

    const allowedFields = PersonFilterCompiler.COLLECTION_FIELDS[collection];
    const clauses = scope.grants.flatMap((grant) => {
      if (grant.kind !== "byField" || grant.ids.length === 0) return [];
      // Undefined means this collection cannot express the grant — see
      // COLLECTION_FIELDS.
      const column = allowedFields.get(grant.field);
      return column ? [`${column}:=${quoteList(grant.ids)}`] : [];
    });

    if (clauses.length === 0) return NEVER_MATCH_CLAUSE;
    return clauses.join(" || ");
  }
}
