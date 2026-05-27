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

import { Accordion, type AccordionCopy } from "../Accordion";

export type AccordionExampleArgs = {
  copy: AccordionCopy;
  onToggle: (id: string) => void;
};

export default function AccordionExample({
  copy,
  onToggle,
}: AccordionExampleArgs) {
  const [toggledPanels, setToggledPanels] = useState<
    Partial<Record<string, boolean>>
  >({});

  return (
    <Accordion
      copy={copy}
      toggledPanels={toggledPanels}
      onToggle={(id) => {
        setToggledPanels((prev) => ({ ...prev, [id]: !prev[id] }));
        onToggle(id);
      }}
    />
  );
}
