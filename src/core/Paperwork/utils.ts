// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { isString } from "lodash";
import { MutableRefObject, useEffect, useState } from "react";

export const useAnimatedValue = (
  input: MutableRefObject<HTMLInputElement>,
  value?: string,
  duration = 1750,
  delay = 250
): boolean => {
  const [mountedAt] = useState<number>(+new Date() + delay);
  const [animated, setAnimated] = useState<boolean>(false);

  useEffect(() => {
    let animationFrameId = 0;
    const animate = () => {
      if (!value || !isString(value)) return;

      const elapsed = +new Date() - mountedAt;

      const range = Math.ceil(value.length * Math.min(1, elapsed / duration));

      // eslint-disable-next-line no-param-reassign
      input.current.value = value.substr(0, range);

      if (elapsed <= duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setAnimated(true);
      }
    };

    if (input.current) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [input, mountedAt, duration, value, setAnimated]);

  return animated;
};
