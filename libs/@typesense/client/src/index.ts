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

export {
  createLocalTypesenseClient,
  createTypesenseClient,
  createTypesenseClientFromEnv,
  type TypesenseClientConfig,
} from "./client";
export {
  composeDocIdFromFields,
  type DocIdFieldsOverride,
  type DocIdOverrides,
  type DocIdPrefixOverride,
  type FirestoreDoc,
  mergeDocIdFromPath,
  toTypesenseId,
} from "./docIds";
export { collectionNames, schemas } from "./schemas";
export {
  type BaseScope,
  type CaseloadCollectionFields,
  CaseloadFilterCompiler,
  type CaseloadScope,
  type CaseloadScopeCollection,
  PersonFilterCompiler,
  type PersonGrant,
  type PersonResolverInput,
  type PersonScope,
  type PersonScopeCollection,
  type PersonScopeField,
  type PerSystemScopes,
  resolveCaseloadScope,
  resolvePersonScope,
  type ResolvePersonScopeInput,
  type ResolverInput,
  type ResolveScopeFeatureVariants,
  type ResolveScopeInput,
  type ResolveScopeUser,
  resolveStateBase,
  type SingleWorkflowsSystem,
} from "./scope";
export {
  createScopedTypesenseClient,
  type CreateScopedTypesenseClientConfig,
  type ScopedTypesenseClient,
} from "./scopedClient";
