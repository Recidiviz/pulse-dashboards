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

// Staff-side scoping for the caseload search bar: which officers, facility
// staff and locations a user may search. See ./ScopedKeyMinter for the shared
// sequence these hooks plug into.

import {
  CaseloadFilterCompiler,
  type CaseloadScope,
  type PerSystemScopes,
  resolveCaseloadScope,
  type SingleWorkflowsSystem,
} from "~@typesense/client";

import { ScopedKeyMinter } from "./ScopedKeyMinter";

export class CaseloadScopedKeyMinter extends ScopedKeyMinter<CaseloadScope> {
  protected unrestrictedScope(): CaseloadScope {
    return { base: { kind: "unrestricted" } };
  }

  protected resolveForSystem(system: SingleWorkflowsSystem): CaseloadScope {
    return resolveCaseloadScope({ ...this.resolverInput, system });
  }

  protected compile(
    scopes: PerSystemScopes<CaseloadScope>,
  ): Record<string, string> {
    return new CaseloadFilterCompiler(this.stateCode).compile(scopes);
  }
}
