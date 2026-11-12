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

import { useEffect } from "react";

// This file lives one folder below examples/ and isn't named *.examples.tsx,
// so the examples indexer doesn't read it as a story.

/**
 * Clicks the open dialog's submit button as soon as it's enabled, to show
 * what follows a submit, such as the waiting button or the server's error.
 * Render it next to the dialog.
 */
export function SubmitOnOpen() {
  useEffect(() => {
    let frame = 0;
    const clickWhenReady = () => {
      const button = document.querySelector<HTMLButtonElement>(
        '[role="dialog"] button[type="submit"]',
      );
      if (button && !button.disabled) {
        button.click();
        return;
      }
      frame = requestAnimationFrame(clickWhenReady);
    };
    frame = requestAnimationFrame(clickWhenReady);
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
