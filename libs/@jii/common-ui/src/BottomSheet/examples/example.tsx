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

import { useState } from "react";

import { Body16, Serif24 } from "~design-system";

import { JIIButton } from "../../Buttons/JIIButton";
import { BottomSheet, type BottomSheetProps } from "../BottomSheet";

export type BottomSheetExampleArgs = Omit<
  BottomSheetProps,
  "isOpen" | "children" | "ariaLabel"
>;

export default function BottomSheetExample({
  closeLabel,
  onRequestClose,
}: BottomSheetExampleArgs) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <JIIButton onClick={() => setIsOpen(true)}>Open bottom sheet</JIIButton>
      )}
      <BottomSheet
        isOpen={isOpen}
        onRequestClose={() => {
          setIsOpen(false);
          onRequestClose();
        }}
        closeLabel={closeLabel}
        ariaLabel="Example bottom sheet"
      >
        <Serif24>Section heading</Serif24>
        <ol>
          {Array.from({ length: 20 }, (_, i) => (
            <Body16 key={i} as="li">
              The quick brown fox jumps over the lazy dog.
            </Body16>
          ))}
        </ol>
      </BottomSheet>
    </>
  );
}
