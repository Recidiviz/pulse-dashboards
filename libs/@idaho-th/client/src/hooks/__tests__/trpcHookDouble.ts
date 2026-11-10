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

/**
 * A stand-in for the generated `trpc` react-query client.
 *
 * The hooks in `src/hooks/` exist to bind a procedure to its query options and
 * its cache invalidations. That binding is what these doubles make assertable:
 * which procedure a hook calls, the input and options it passes, and — once a
 * mutation's `onSuccess`/`onSettled` is invoked — exactly which queries it
 * invalidates. A missing `invalidate()` is the most common defect in this
 * layer and is otherwise invisible to a test.
 */

export type RecordedQuery = {
  path: string;
  input: unknown;
  options: Record<string, unknown>;
};

export type RecordedMutation = {
  path: string;
  options: Record<string, unknown>;
};

export type RecordedInvalidation = {
  path: string;
  input: unknown;
};

/** A `setData` call; `updater` is applied by the test to a cached value. */
export type RecordedSetData = {
  path: string;
  input: unknown;
  updater: (old: unknown) => unknown;
};

export type RecordedFetch = {
  path: string;
  input: unknown;
};

type CallHandler = (path: string[], args: unknown[]) => unknown;

/**
 * Builds a proxy where any property chain is a procedure path and calling the
 * last segment invokes `onCall` with that path.
 */
function pathProxy(onCall: CallHandler, path: string[] = []): never {
  // The target only has to be callable; every get and call is intercepted.
  const callableTarget = () => undefined;

  return new Proxy(callableTarget as object, {
    get: (_target, property) =>
      typeof property === "string"
        ? pathProxy(onCall, [...path, property])
        : undefined,
    apply: (_target, _thisArg, args: unknown[]) => onCall(path, args),
  }) as never;
}

export function createTrpcDouble() {
  const queries: RecordedQuery[] = [];
  const mutations: RecordedMutation[] = [];
  const invalidations: RecordedInvalidation[] = [];
  const fetches: RecordedFetch[] = [];
  const setDataCalls: RecordedSetData[] = [];
  /** Data each procedure path should resolve with, keyed by dotted path. */
  const queryData = new Map<string, unknown>();

  const utils = pathProxy((path, args) => {
    const method = path.at(-1);
    const procedure = path.slice(0, -1).join(".");

    if (method === "invalidate") {
      invalidations.push({ path: procedure, input: args[0] });
      return Promise.resolve();
    }
    if (method === "setData") {
      setDataCalls.push({
        path: procedure,
        input: args[0],
        updater: args[1] as RecordedSetData["updater"],
      });
      return undefined;
    }
    if (method === "fetch") {
      fetches.push({ path: procedure, input: args[0] });
      return Promise.resolve(queryData.get(procedure));
    }
    if (method === "mutate") {
      const withoutClient = path[0] === "client" ? path.slice(1) : path;
      const mutationProcedure = withoutClient.slice(0, -1).join(".");
      fetches.push({ path: mutationProcedure, input: args[0] });
      return Promise.resolve(queryData.get(mutationProcedure));
    }
    return undefined;
  });

  const trpc = pathProxy((path, args) => {
    const method = path.at(-1);
    const procedure = path.slice(0, -1).join(".");

    if (method === "useUtils") return utils;

    if (method === "useQuery") {
      const options = (args[1] ?? {}) as Record<string, unknown>;
      queries.push({ path: procedure, input: args[0], options });
      return {
        data: queryData.get(procedure),
        isLoading: false,
        isError: false,
      };
    }

    if (method === "useMutation") {
      const options = (args[0] ?? {}) as Record<string, unknown>;
      mutations.push({ path: procedure, options });
      return { mutate: () => undefined, mutateAsync: () => Promise.resolve() };
    }

    return undefined;
  });

  return {
    trpc,
    utils,
    queries,
    mutations,
    invalidations,
    fetches,
    setDataCalls,

    /** Makes `useQuery` on `path` resolve with `data`. */
    setQueryData(path: string, data: unknown) {
      queryData.set(path, data);
    },

    reset() {
      queries.length = 0;
      mutations.length = 0;
      invalidations.length = 0;
      fetches.length = 0;
      setDataCalls.length = 0;
      queryData.clear();
    },

    query(path: string): RecordedQuery {
      const found = queries.find((entry) => entry.path === path);
      if (!found) {
        throw new Error(
          `no useQuery recorded for "${path}"; saw: ${queries
            .map((entry) => entry.path)
            .join(", ")}`,
        );
      }
      return found;
    },

    mutation(path: string): RecordedMutation {
      const found = mutations.find((entry) => entry.path === path);
      if (!found) {
        throw new Error(
          `no useMutation recorded for "${path}"; saw: ${mutations
            .map((entry) => entry.path)
            .join(", ")}`,
        );
      }
      return found;
    },

    /** The set of procedures invalidated so far, in call order. */
    invalidatedPaths(): string[] {
      return invalidations.map((entry) => entry.path);
    },

    /** The set of procedures imperatively fetched so far, in call order. */
    fetchedPaths(): string[] {
      return fetches.map((entry) => entry.path);
    },
  };
}

export type TrpcDouble = ReturnType<typeof createTrpcDouble>;
