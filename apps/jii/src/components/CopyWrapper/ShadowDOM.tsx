// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { FC, ReactNode } from "react";
import root from "react-shadow/styled-components";

const ShadowRoot = root["div"];

/**
 * Wrapping this around a component will cause it to be rendered in a Shadow DOM.
 * Particularly useful for custom components with their own styles that would otherwise
 * be affected by the cascade from CopyWrapper.
 */
export const ShadowDOM: FC<{ children: ReactNode }> = ({ children }) => {
  return <ShadowRoot>{children}</ShadowRoot>;
};

/**
 * Returns a functional component that wraps the provided Component
 * in a {@link ShadowDOM}
 */
export function withShadowDOM<P extends object>(Component: FC<P>) {
  return function ShadowWrapper(props: P) {
    return (
      <ShadowDOM>
        <Component {...props} />
      </ShadowDOM>
    );
  };
}
