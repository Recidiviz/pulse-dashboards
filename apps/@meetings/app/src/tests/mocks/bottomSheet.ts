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

import type { ReactNode } from "react";

type PassthroughProps = {
  children?: ReactNode;
  footerComponent?: (props: object) => ReactNode;
};

/**
 * Shared Jest mock for `@gorhom/bottom-sheet`. The library relies on native
 * gesture/animation modules that don't run under jsdom, so we replace every
 * container with a plain passthrough that renders its children (plus the
 * footer, when a container provides one).
 *
 * Use inside a `jest.mock` factory so the requires stay lazy:
 *   jest.mock("@gorhom/bottom-sheet", () =>
 *     require("~@meetings/app/tests/mocks/bottomSheet").bottomSheetMock(),
 *   );
 */
export function bottomSheetMock() {
  // Required lazily: this runs inside the jest.mock factory, after setup.
  const React = require("react");
  const { TextInput } = require("react-native");

  const withFooter = ({ children, footerComponent }: PassthroughProps) =>
    React.createElement(
      React.Fragment,
      null,
      children,
      footerComponent ? footerComponent({}) : null,
    );

  const passthrough = ({ children }: PassthroughProps) => children;

  return {
    __esModule: true,
    // Default export (`BottomSheet`) and `BottomSheetModal` are containers that
    // may render a footer component.
    default: withFooter,
    BottomSheetModal: withFooter,
    BottomSheetView: passthrough,
    BottomSheetScrollView: passthrough,
    BottomSheetFooter: passthrough,
    BottomSheetBackdrop: () => null,
    BottomSheetTextInput: TextInput,
    TouchableWithoutFeedback: passthrough,
  };
}
