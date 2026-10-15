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

/**
 * Returns whether to show the scroll cue: true while some of the page's
 * content is hidden below the bottom of the screen, so the resident would need
 * to scroll down to see it.
 *
 * - blankSpaceBelowContent is how far the page can still scroll once its last
 *   content is fully visible: empty space the layout reserves below the
 *   content. It's subtracted so the cue goes away once that content comes into
 *   view, rather than while there's only empty space left to scroll.
 * - minHiddenContent is the least hidden content worth showing the cue for, so
 *   it doesn't show for a sliver of content. Defaults to 24.
 *
 * Both values are numbers of pixels.
 */
export function useShouldShowScrollCue({
  blankSpaceBelowContent,
  minHiddenContent = 24,
}: {
  blankSpaceBelowContent: number;
  minHiddenContent?: number;
}) {
  const [shouldShowScrollCue, setShouldShowScrollCue] = useState(false);

  useEffect(() => {
    const update = () => {
      const remainingScroll =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      setShouldShowScrollCue(
        remainingScroll - blankSpaceBelowContent > minHiddenContent,
      );
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [blankSpaceBelowContent, minHiddenContent]);

  return shouldShowScrollCue;
}
