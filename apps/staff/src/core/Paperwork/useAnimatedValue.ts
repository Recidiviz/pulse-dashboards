// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { reaction } from "mobx";
import { RefObject, useEffect, useState } from "react";

import { useRootStore } from "../../components/StoreProvider";

export const DEFAULT_ANIMATION_DURATION = 1750;

export const useAnimatedValue = (
  input: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  value?: string,
  duration = DEFAULT_ANIMATION_DURATION,
  delay = 250,
): boolean => {
  const [mountedAt, setMountedAt] = useState<number>(+new Date() + delay);
  const [animated, setAnimated] = useState<boolean>(false);
  const { workflowsStore } = useRootStore();

  useEffect(() => {
    let animationFrameId = 0;
    const animate = () => {
      if (!input.current || !value || !isString(value)) return;

      const elapsed = +new Date() - mountedAt;

      const range = Math.ceil(value.length * Math.min(1, elapsed / duration));

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

  // Effect that triggers when a user selects the Download CTA and stops the form-filling animation
  useEffect(() => {
    return reaction(
      () => workflowsStore.formIsDownloading,
      () => {
        if (workflowsStore.formIsDownloading) {
          setMountedAt(0);
          setAnimated(true);
        }
      },
    );
  }, [workflowsStore]);

  return animated;
};
