// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import { AVAILABLE_FONTS } from "@recidiviz/design-system";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { autorun } from "mobx";
import * as React from "react";
import { ReactElement } from "react";
import { ThemeProvider } from "styled-components/macro";

/**
 * Convenience method to run an immediate, one-time reactive effect
 */
export function reactImmediately(effect: () => void): void {
  // this will call the effect function immediately,
  // and then immediately call the disposer to tear down the reaction
  autorun(effect)();
}

const BaseThemeProvider: React.FC = ({ children }) => {
  return (
    <ThemeProvider
      theme={{
        fonts: {
          heading: AVAILABLE_FONTS.LIBRE_BASKERVILLE,
          body: AVAILABLE_FONTS.LIBRE_FRANKLIN,
          serif: AVAILABLE_FONTS.LIBRE_BASKERVILLE,
          sans: AVAILABLE_FONTS.LIBRE_FRANKLIN,
        },
      }}
    >
      {children}
    </ThemeProvider>
  );
};

/* Implementing customRender for ThemeProvider use as per https://testing-library.com/docs/react-testing-library/setup/#custom-render */
const customRender = (
  ui: ReactElement,
  options: RenderOptions = {}
): RenderResult => render(ui, { wrapper: BaseThemeProvider, ...options });

export * from "@testing-library/react";
export { customRender as render };
