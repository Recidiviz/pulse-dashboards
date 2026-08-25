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
 * Tracks whether a `position: sticky` element has detached from its normal
 * flow position and become pinned in place.
 *
 * Pass a ref to a zero-height sentinel element rendered immediately before
 * the sticky element in the DOM, and a `rootMargin` matching the sticky
 * element's `top` offset (e.g. `"-64px 0px 0px 0px"` for `top: 64px`). The
 * sentinel scrolls with the document; once it scrolls above that offset,
 * the sticky element has engaged.
 */
const useIsStuck = (sentinel: Element | null, rootMargin: string): boolean => {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (!sentinel) {
      setIsStuck(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [sentinel, rootMargin]);

  return isStuck;
};

export default useIsStuck;
