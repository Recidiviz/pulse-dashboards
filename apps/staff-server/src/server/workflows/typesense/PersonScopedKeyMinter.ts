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

// Person-side scoping for the nav-bar person search: which clients and
// residents a user may search. See ./ScopedKeyMinter for the shared sequence
// these hooks plug into.

import {
  PersonFilterCompiler,
  type PersonResolverInput,
  type PersonScope,
  type PerSystemScopes,
  resolvePersonScope,
  type SingleWorkflowsSystem,
} from "~@typesense/client";

import { ScopedKeyMinter } from "./ScopedKeyMinter";

export class PersonScopedKeyMinter extends ScopedKeyMinter<PersonScope> {
  protected unrestrictedScope(): PersonScope {
    return { grants: [{ kind: "unrestricted" }] };
  }

  protected resolveForSystem(system: SingleWorkflowsSystem): PersonScope {
    return resolvePersonScope({ ...this.personResolverInput, system });
  }

  protected compile(
    scopes: PerSystemScopes<PersonScope>,
  ): Record<string, string> {
    return new PersonFilterCompiler(this.stateCode).compile(scopes);
  }

  // The person resolver additionally translates the staff-side scope onto
  // person docs: `staffExternalId` turns an own-caseload (byEmail) base into an
  // officerId grant, and the supervised ids turn the supervisor expansion into
  // one.
  private get personResolverInput(): PersonResolverInput {
    return {
      ...this.resolverInput,
      staffExternalId: this.ctx.userId,
      supervisedStaffExternalIds: this.ctx.supervisedStaffExternalIds,
    };
  }
}
