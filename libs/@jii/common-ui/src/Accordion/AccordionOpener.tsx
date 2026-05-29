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

import { Link } from "react-router-dom";

import { useAccordionContext } from "~@jii/common-ui";

/**
 * A react-router link that jumps to and opens the panel with given ID in this accordion.
 */
export const AccordionOpener = function AccordionOpener({
  panelId,
  children,
}: {
  panelId: string;
  children: string;
}) {
  const { id, onToggle, toggledPanels } = useAccordionContext();
  return (
    // Note: the ID format in `to` must match the element ID format defined in Accordion
    <Link
      to={`#${id}-${panelId}`}
      onClick={() => {
        // Open the panel if it's currently closed
        if (!toggledPanels[panelId]) {
          onToggle(panelId);
        }
      }}
    >
      {children}
    </Link>
  );
};
