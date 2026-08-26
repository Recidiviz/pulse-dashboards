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
// clients and residents. Separate filters because `residents` declares no
// `district`. See ./CaseloadFilterCompiler for why, and for why these two
// compilers stay independent instead of sharing a base class.

import type {
  PersonScope,
  PersonScopeCollection,
  PersonScopeField,
  PerSystemScopes,
} from "./types";
import { NEVER_MATCH_CLAUSE, quoteList, withStateClause } from "./utils";

export class PersonFilterCompiler {
  /**
   * Which grant fields each person collection can express. See the note on
   * CaseloadFilterCompiler.COLLECTION_FIELDS for the drop-never-widen rule.
   */
  static readonly COLLECTION_FIELDS: Record<
    PersonScopeCollection,
    ReadonlySet<PersonScopeField>
  > = {
    clients: new Set<PersonScopeField>(["district", "officerId"]),
    // Residents carry no `district`; incarceration scoping is facility-shaped.
    // No state's INCARCERATION baseline is district-scoped today, so a district
    // grant never reaches this collection.
    residents: new Set<PersonScopeField>(["officerId"]),
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

    return filters;
  }

  private predicateFor(
    scope: PersonScope,
    collection: PersonScopeCollection,
  ): string | null {
    if (scope.grants.some((grant) => grant.kind === "unrestricted"))
      return null;

    const allowedFields = PersonFilterCompiler.COLLECTION_FIELDS[collection];
    const clauses = scope.grants.flatMap((grant) =>
      grant.kind === "byField" &&
      allowedFields.has(grant.field) &&
      grant.ids.length > 0
        ? [`${grant.field}:=${quoteList(grant.ids)}`]
        : [],
    );

    if (clauses.length === 0) return NEVER_MATCH_CLAUSE;
    return clauses.join(" || ");
  }
}
