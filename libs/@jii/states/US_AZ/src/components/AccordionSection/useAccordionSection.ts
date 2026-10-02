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

import { AccordionCopy } from "~@jii/common-ui";

export type ToggledPanels = Partial<Record<string, boolean>>;

export type AccordionSectionProps = {
  id: string;
  accordionCopy: AccordionCopy;
  sectionCopy: {
    header?: string;
    openAllCopy: string;
    closeAllCopy: string;
  };
};

/**
 * Tracks which panels of an accordion section are open.
 *
 * This is a hook rather than a presenter because this component is subject to a lot of re-rendering
 * by React Router (e.g. hash navigations within pages) and managing the presenter lifecycle to
 * persist the toggle state would require a lot of memoization or session storage. Simply tying the state
 * to the component's mount/unmount lifecycle is a lot cleaner in this case.
 */
export function useAccordionSection({
  accordionCopy,
  sectionCopy,
}: AccordionSectionProps) {
  const [toggledPanels, setToggledPanels] = useState<ToggledPanels>({});

  const toggle = (panelId: string) =>
    setToggledPanels((prev) => ({ ...prev, [panelId]: !prev[panelId] }));

  const closeAll = () => setToggledPanels({});

  const openAll = () =>
    setToggledPanels(
      Object.fromEntries(
        Object.keys(accordionCopy).map((panelId) => [panelId, true]),
      ),
    );

  const somePanelIsClosed = Object.keys(accordionCopy).some(
    (panelId) => !toggledPanels[panelId],
  );
  const showOrHideAll = somePanelIsClosed
    ? { buttonCopy: sectionCopy.openAllCopy, onButtonClick: openAll }
    : { buttonCopy: sectionCopy.closeAllCopy, onButtonClick: closeAll };

  return { toggledPanels, toggle, showOrHideAll };
}
