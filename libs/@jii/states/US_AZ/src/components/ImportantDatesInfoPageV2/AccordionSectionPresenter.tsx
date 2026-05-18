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

import { makeAutoObservable } from "mobx";

import { AccordionCopy } from "~@jii/common-ui";

export type AccordionSectionProps = {
  id: string;
  accordionCopy: AccordionCopy;
  sectionCopy: {
    header: string;
    openAllCopy: string;
    closeAllCopy: string;
  };
};

export class AccordionSectionPresenter {
  public toggledPanels: Partial<Record<string, boolean>>;

  constructor(
    public id: AccordionSectionProps["id"],
    public accordionCopy: AccordionSectionProps["accordionCopy"],
    public sectionCopy: AccordionSectionProps["sectionCopy"],
  ) {
    this.toggledPanels = {};

    makeAutoObservable(this, {}, { autoBind: true });
  }

  /**
   * Open or close the accordion panel with given ID.
   */
  toggle(id: string) {
    this.toggledPanels[id] = !this.toggledPanels[id];
  }

  private openAll() {
    this.toggledPanels = Object.fromEntries(
      Object.keys(this.accordionCopy).map((id) => [id, true]),
    );
  }

  private closeAll() {
    this.toggledPanels = {};
  }

  /**
   * Returns copy for the button to open/close all accordion panels and a function
   * that should be called on button click.
   */
  get showOrHideAll(): { buttonCopy: string; onButtonClick: () => void } {
    const somePanelIsClosed = Object.keys(this.accordionCopy).some(
      (id) => !this.toggledPanels[id],
    );

    if (somePanelIsClosed) {
      return {
        buttonCopy: this.sectionCopy.openAllCopy,
        onButtonClick: () => {
          this.openAll();
        },
      };
    } else {
      // Only show option to close all accordions if all of them are open.
      return {
        buttonCopy: this.sectionCopy.closeAllCopy,
        onButtonClick: () => {
          this.closeAll();
        },
      };
    }
  }
}
