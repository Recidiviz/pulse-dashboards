// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { animated, useTransition } from "@react-spring/web";
import { Loading } from "@recidiviz/design-system";
import assertNever from "assert-never";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect } from "react";
import styled from "styled-components/macro";

import { isHydrationUntouched } from "../Hydratable/utils";
import { HydratorProps } from "./types";

const Wrapper = styled.div`
  position: relative;
  height: 100%;
`;

const StatusWrapper = styled(animated.div)`
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  padding: ${rem(32)};
  width: 100%;

  & > div {
    width: 100%;
  }
`;

const ContentWrapper = styled(animated.div)`
  height: 100%;
  width: 100%;
`;

const crossFade = {
  initial: { opacity: 1, top: 0 },
  from: { opacity: 0 },
  enter: { opacity: 1 },
  leave: { opacity: 0, position: "absolute" },
  config: { friction: 40, tension: 280 },
} as const;

/**
 * Observes the provided `hydratable` and only renders `children` if it is hydrated;
 * otherwise renders a loading or error state as appliable. Also initiates hydration
 * of the model if it is not already pending.
 */
export const Hydrator: React.FC<HydratorProps> = observer(function Hydrator({
  children,
  hydratable,
  className,
  failed,
  loading,
}) {
  const hydrationStatus = hydratable.hydrationState.status;
  const needsHydration = isHydrationUntouched(hydratable);

  useEffect(() => {
    if (needsHydration) {
      hydratable.hydrate();
    }
  }, [hydratable, needsHydration]);

  const transitions = useTransition(hydrationStatus, crossFade);

  return (
    <Wrapper className={className}>
      {transitions((style, item) => {
        switch (item) {
          case "needs hydration":
          case "loading":
            switch (loading) {
              case null:
                return null;
              case undefined:
                return (
                  <StatusWrapper style={style}>
                    <Loading />
                  </StatusWrapper>
                );
              default:
                return <StatusWrapper style={style}>{loading}</StatusWrapper>;
            }
          case "failed":
            return <StatusWrapper style={style}>{failed}</StatusWrapper>;
          case "hydrated":
            return <ContentWrapper style={style}>{children}</ContentWrapper>;
          default:
            return assertNever(item);
        }
      })}
    </Wrapper>
  );
});
