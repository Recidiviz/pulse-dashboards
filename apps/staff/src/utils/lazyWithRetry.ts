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

import {
  ComponentType,
  lazy,
  LazyExoticComponent,
  useCallback,
  useMemo,
  useState,
} from "react";

/**
 * Hook variant of `React.lazy` that supports manual retry. Stock `React.lazy`
 * caches its first promise — including a rejection — on the
 * `LazyExoticComponent` itself, so an `ErrorBoundary`'s `resetError()` alone
 * cannot recover a failed dynamic import. This hook returns a fresh
 * `LazyExoticComponent` whenever `retry()` is invoked, which forces the
 * `import()` to be re-attempted on the next render.
 */
export function useLazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): [LazyExoticComponent<T>, () => void] {
  const [retryKey, setRetryKey] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Lazy = useMemo(() => lazy(factory), [retryKey]);
  const retry = useCallback(() => setRetryKey((k) => k + 1), []);
  return [Lazy, retry];
}
