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

import { useEffect, useState } from "react";
import ReactModal from "react-modal";

import type {
  CalendarApiConfig,
  EntryDto,
  MonthDetail,
} from "~@parole-board/common";

import { AddHearingForm } from "../../AddHearingForm";
import { AddHearingModalForm } from "../../AddHearingModal";
import { parseChoice } from "../../hearingChoices";
import { useAddHearingForm } from "../../useAddHearingForm";

// This file lives one folder below examples/ and isn't named *.examples.tsx,
// so the examples indexer doesn't read it as a story.

export type ExampleAddHearingModalProps = {
  /** The calendar config whose kinds, resources and weekdays the form offers. */
  config: CalendarApiConfig;
  /** The month the hearing goes in. */
  month: MonthDetail;
  /**
   * The month's entries in place of its own; choices already on the chosen
   * day are disabled. None by default.
   */
  entries?: EntryDto[];
  /** The day the dialog opens on, as "YYYY-MM-DD" in September 2026. */
  initialDay: string;
  /** A boardSessionValue or facilityValue, as the container builds them. */
  initialChoice?: string | null;
  /** Opens the Facilities menu once the dialog renders. */
  openFacilities?: boolean;
  /** The add the button sends; by default it succeeds at once. */
  send?: () => Promise<void>;
  /** Presses the add button once the dialog renders, to show what follows. */
  submitOnOpen?: boolean;
};

/**
 * Sets the Modal's app element to the story root. The Modal opens on the
 * first render, so this runs during render rather than in an effect, which
 * would run after it.
 */
export function useExampleAppElement() {
  useState(() =>
    ReactModal.setAppElement(
      document.getElementById("storybook-root") ?? document.body,
    ),
  );
}

/**
 * Clicks an element in the open dialog once it has rendered. The Modal
 * renders its content into a portal as it opens, which is done by the time
 * this effect's timer runs.
 */
function useClickInDialogOnMount(selector: string | null) {
  useEffect(() => {
    if (!selector) return undefined;
    const timer = window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(`[role="dialog"] ${selector}`)
        ?.click();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selector]);
}

/**
 * Clicks the Facilities toggle once. The DS Dropdown keeps its open state
 * inside, so a click is the only way to show the menu open. The Modal then
 * moves focus to the menu's first item, which the DS menu paints as
 * highlighted, so focus goes back to the toggle to show the menu as a mouse
 * user first sees it.
 */
function useOpenFacilitiesOnMount(open: boolean) {
  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      const toggle = document.querySelector<HTMLElement>(
        '[role="dialog"] [aria-haspopup="menu"]',
      );
      toggle?.click();
      window.setTimeout(() => toggle?.focus(), 0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);
}

/**
 * The Add hearing dialog as the container draws it, with the form starting
 * on initialChoice and initialDay, so each example stays interactive. The
 * choices come from config through hearingChoices, as the container builds
 * them, and send stands in for the add.
 */
export function ExampleAddHearingModal({
  config,
  month: storedMonth,
  entries = [],
  initialDay,
  initialChoice = null,
  openFacilities = false,
  send = () => Promise.resolve(),
  submitOnOpen = false,
}: ExampleAddHearingModalProps) {
  const [isOpen, setOpen] = useState(true);
  const month = { ...storedMonth, entries };
  const parsed = initialChoice ? parseChoice(initialChoice) : null;
  const [defaultValues] = useState(() => ({
    boardSession: parsed?.type === "boardSession" ? initialChoice : null,
    facility: parsed?.type === "facility" ? initialChoice : null,
    day: initialDay,
  }));
  const form = useAddHearingForm({
    month,
    config,
    defaultValues,
    send: async () => {
      await send();
      setOpen(false);
    },
  });

  useExampleAppElement();
  useOpenFacilitiesOnMount(openFacilities);
  useClickInDialogOnMount(submitOnOpen ? 'button[type="submit"]' : null);

  return (
    <AddHearingModalForm
      form={form}
      isOpen={isOpen}
      month={month}
      config={config}
      onCancel={() => setOpen(false)}
    >
      <AddHearingForm
        form={form}
        month={month}
        config={config}
        entries={month.entries}
      />
    </AddHearingModalForm>
  );
}
