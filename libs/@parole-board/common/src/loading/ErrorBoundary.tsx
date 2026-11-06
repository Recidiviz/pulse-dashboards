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

import { Component, ReactNode } from "react";

type ErrorBoundaryProps = {
  /**
   * Renders in place of children after a render error, with the error caught
   * and a retry.
   */
  renderFallback: (error: unknown, retry: () => void) => ReactNode;
  /** Runs with each error the boundary catches. */
  onError?: (error: unknown) => void;
  /** Runs before a retry re-renders children. */
  onReset?: () => void;
  /** A change to any of these clears the error, as a retry does. */
  resetKeys?: readonly unknown[];
  children: ReactNode;
};

// error is unknown because anything can be thrown, including undefined, so
// hasError records that something was.
type ErrorBoundaryState = { hasError: boolean; error: unknown };

const keysChanged = (a: readonly unknown[] = [], b: readonly unknown[] = []) =>
  a.length !== b.length || a.some((key, i) => !Object.is(key, b[i]));

/**
 * Catches a render error, such as a failed Suspense query, and renders
 * renderFallback with the error and a retry. React only supports error
 * boundaries as class components, and the repo has no shared one these
 * libraries can import.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }

  override componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState,
  ) {
    // Only an error that was already showing is cleared, so the update that
    // caught the error doesn't reset it straight away.
    if (
      prevState.hasError &&
      this.state.hasError &&
      keysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.retry();
    }
  }

  retry = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    return this.state.hasError
      ? this.props.renderFallback(this.state.error, this.retry)
      : this.props.children;
  }
}
