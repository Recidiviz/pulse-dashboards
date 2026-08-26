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

// Turns a (tenant, system, UserScopeContext) tuple into the per-collection
// filter_by set a scoped key is minted from.
//
// Caseload and person scoping run the identical sequence and differ only in
// which resolver and which compiler they call. That is what the subclass hooks
// supply.

import type {
  PerSystemScopes,
  ResolverInput,
  SingleWorkflowsSystem,
} from "~@typesense/client";
import type { SystemId } from "~datatypes";

import type {
  ScopeAndFilters,
  ScopeAndFiltersResolver,
  UserScopeContext,
} from "./types";

export abstract class ScopedKeyMinter<Scope>
  implements ScopeAndFiltersResolver
{
  constructor(
    protected readonly stateCode: string,
    protected readonly ctx: UserScopeContext,
  ) {}

  resolve(system: SystemId): ScopeAndFilters {
    const { isRecidivizUser } = this.ctx;

    const scopes = this.spreadAcrossSystems(system, (forSystem) =>
      isRecidivizUser
        ? this.unrestrictedScope()
        : this.resolveForSystem(forSystem),
    );

    return {
      scope: scopes,
      filtersByCollection: this.compile(scopes),
      debugSystem: isRecidivizUser ? "ADMIN" : system,
    };
  }

  // Recidiviz users have no staff record in any tenant, so they get everything
  // within whichever tenant they are currently viewing.
  protected abstract unrestrictedScope(): Scope;

  protected abstract resolveForSystem(system: SingleWorkflowsSystem): Scope;

  protected abstract compile(
    scopes: PerSystemScopes<Scope>,
  ): Record<string, string>;

  // The shared half of the resolver input.
  //
  // A user with no staff record (e.g. a supervisor who isn't an officer
  // themselves) still gets a scope here — derived from email + isSupervisor +
  // feature variants. The state-baseline resolver handles the no-district case
  // by falling back to byEmail or `none`; supervisor expansion then layers in
  // the supervisorExternalId match.
  protected get resolverInput(): ResolverInput {
    const { ctx } = this;
    return {
      stateCode: this.stateCode,
      user: {
        id: ctx.userId,
        email: ctx.userEmail,
        district: ctx.district,
        overrideDistrictIds: ctx.overrideDistrictIds,
        roleSubtype: ctx.roleSubtype,
        hasCaseload: ctx.hasCaseload,
      },
      activeFeatureVariants: {
        supervisionUnrestrictedSearch: Boolean(
          ctx.featureVariants["supervisionUnrestrictedSearch"],
        ),
        workflowsSupervisorSearch: Boolean(
          ctx.featureVariants["workflowsSupervisorSearch"],
        ),
      },
      isSupervisor: ctx.isSupervisor,
    };
  }

  // ALL resolves each system separately rather than reusing one scope, because
  // the rules can differ — e.g. US_MI is district-scoped for SUPERVISION but
  // unrestricted for INCARCERATION. The compiler reads which slots are filled
  // to decide which collections to emit filters for.
  private spreadAcrossSystems(
    system: SystemId,
    resolveOne: (system: SingleWorkflowsSystem) => Scope,
  ): PerSystemScopes<Scope> {
    if (system === "ALL") {
      return {
        supervision: resolveOne("SUPERVISION"),
        incarceration: resolveOne("INCARCERATION"),
      };
    }
    if (system === "INCARCERATION") {
      return { incarceration: resolveOne("INCARCERATION") };
    }
    return { supervision: resolveOne("SUPERVISION") };
  }
}
