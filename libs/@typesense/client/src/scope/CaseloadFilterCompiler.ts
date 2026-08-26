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

// Compiles a caseload (staff-visibility) scope into one Typesense filter_by per
// collection: supervisionStaff, incarcerationStaff and locations.
//
// One filter per collection, rather than one shared filter, because Typesense
// validates every field named in a filter_by against the schema of the
// collection being searched and rejects the query outright when a field is
// undeclared. Per-collection filters let each collection declare only the fields
// it really has. The frontend carries them in one multi_search by stamping each
// search with its own `x-typesense-api-key`.
//
// PersonFilterCompiler does the same for clients/residents. The two are
// deliberately independent rather than sharing a base class: their predicates
// have different shapes (a base scope plus an optional expansion, versus a flat
// list of grants), so a common parent could only hold the clause-building
// helpers, which already live in ./utils.

import type {
  CaseloadCollectionFields,
  CaseloadScope,
  CaseloadScopeCollection,
  PerSystemScopes,
  SingleWorkflowsSystem,
} from "./types";
import { NEVER_MATCH_CLAUSE, quote, quoteList, withStateClause } from "./utils";

export class CaseloadFilterCompiler {
  /**
   * Read off the collection schemas in ../schemas.
   *
   * A clause a collection cannot express is DROPPED, never rewritten to
   * something looser. Every clause within a scope is OR'd, so dropping one can
   * only narrow the result set, which fails closed. When dropping leaves no
   * clause at all the filter collapses to NEVER_MATCH_CLAUSE — never to "no
   * restriction".
   */
  static readonly COLLECTION_FIELDS: Record<
    CaseloadScopeCollection,
    CaseloadCollectionFields
  > = {
    supervisionStaff: {
      districtField: "district",
      emailField: "email",
      hasSupervisorFields: true,
    },
    incarcerationStaff: {
      districtField: "district",
      emailField: "email",
      // Supervisor relationships are a supervision-side concept. staff-server's
      // fetchSupervisedStaffExternalIds treats an incarcerationStaff supervisor
      // match as an invariant violation and raises a Sentry warning on it, so
      // the expansion is inexpressible here by design rather than by omission.
      hasSupervisorFields: false,
    },
    locations: {
      districtField: "locationId",
      // A location carries no person-level identity to match an own-caseload scope.
      emailField: null,
      hasSupervisorFields: false,
    },
  };

  constructor(private readonly stateCode: string) {}

  compile(
    scopes: PerSystemScopes<CaseloadScope>,
  ): Partial<Record<CaseloadScopeCollection, string>> {
    const { supervision, incarceration } = scopes;
    const filters: Partial<Record<CaseloadScopeCollection, string>> = {};

    // Each staff collection is inherently single-system, so its key needs no
    // `system:=` discriminator.
    if (supervision) {
      filters.supervisionStaff = withStateClause(
        this.stateCode,
        this.predicateFor(supervision, "supervisionStaff"),
      );
    }

    if (incarceration) {
      filters.incarcerationStaff = withStateClause(
        this.stateCode,
        this.predicateFor(incarceration, "incarcerationStaff"),
      );
    }

    // Districts and facilities share this collection, so this key always carries
    // a `system:=` discriminator. It deliberately does not lean on the per-search
    // `idType` filter: that lives in a client-supplied descriptor, and a scoped
    // key has to bound its own scope.
    if (supervision || incarceration) {
      filters.locations = this.mixedSystemFilter(scopes, "locations");
    }

    return filters;
  }

  // The user-scope predicate for one collection, with no stateCode or system
  // discriminator. Null when the scope places no restriction.
  private predicateFor(
    scope: CaseloadScope,
    collection: CaseloadScopeCollection,
  ): string | null {
    if (scope.base.kind === "unrestricted") return null;

    const fields = CaseloadFilterCompiler.COLLECTION_FIELDS[collection];
    const clauses: string[] = [];

    switch (scope.base.kind) {
      case "byEmail":
        if (fields.emailField) {
          clauses.push(`${fields.emailField}:=${quote(scope.base.email)}`);
        }
        break;
      case "byDistricts":
        if (fields.districtField) {
          clauses.push(
            `${fields.districtField}:=${quoteList(scope.base.districts)}`,
          );
        }
        break;
      case "none":
        // No own scope. The supervisor expansion, if any, becomes the whole
        // predicate.
        break;
    }

    if (scope.expandToSupervisedStaff && fields.hasSupervisorFields) {
      const userId = quote(scope.expandToSupervisedStaff.userId);
      // Singular id and array variant; both are populated in practice.
      clauses.push(
        `supervisorExternalId:=${userId}`,
        `supervisorExternalIds:=[${userId}]`,
      );
    }

    if (clauses.length === 0) return NEVER_MATCH_CLAUSE;
    return clauses.join(" || ");
  }

  // For a collection whose docs span both systems: each system's predicate,
  // discriminated by `system:=` and OR'd under the shared state clause.
  private mixedSystemFilter(
    scopes: PerSystemScopes<CaseloadScope>,
    collection: CaseloadScopeCollection,
  ): string {
    const perSystem = (
      [
        ["SUPERVISION", scopes.supervision],
        ["INCARCERATION", scopes.incarceration],
      ] as const
    )
      .filter(
        (entry): entry is [SingleWorkflowsSystem, CaseloadScope] =>
          entry[1] !== undefined,
      )
      .map(([system, scope]) => {
        const predicate = this.predicateFor(scope, collection);
        return predicate === null
          ? `system:=${quote(system)}`
          : `(system:=${quote(system)} && (${predicate}))`;
      });

    const stateClause = `stateCode:=${quote(this.stateCode)}`;
    if (perSystem.length === 0) return stateClause;
    if (perSystem.length === 1) return `${stateClause} && ${perSystem[0]}`;
    return `${stateClause} && (${perSystem.join(" || ")})`;
  }
}
