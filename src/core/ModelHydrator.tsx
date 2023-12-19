// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { Loading } from "@recidiviz/design-system";
import assertNever from "assert-never";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect } from "react";
import { animated, useTransition } from "react-spring/web.cjs";
import styled from "styled-components/macro";

import { ErrorMessage } from "../components/StatusMessage";
import {
  Hydratable,
  HydrationStateMachine,
  HydrationStatus,
} from "./models/types";

const Wrapper = styled.div`
  position: relative;
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
`;

/**
 * Creates an atomic status variable for transitions
 */
function getHydrationStatus(
  model: Hydratable
): "pending" | "failed" | "hydrated" {
  if (model.error) {
    return "failed";
  }
  if (!model.isHydrated) {
    return "pending";
  }

  return "hydrated";
}

const crossFade = {
  initial: { opacity: 1, top: 0 },
  from: { opacity: 0 },
  enter: { opacity: 1 },
  leave: { opacity: 0, position: "absolute" },
  config: { friction: 40, tension: 280 },
} as const;

type ModelHydratorProps = {
  children: React.ReactElement;
  model: Hydratable | HydrationStateMachine;
  className?: string;
};

/**
 * Observes the provided model and only renders `children` if it is hydrated;
 * otherwise renders a loading state. Also initiates hydration of the model
 * if it is not already pending.
 */
function ModelHydrator({
  children,
  model,
  className,
}: ModelHydratorProps): React.ReactElement {
  let needsHydration: boolean;
  let hydrationStatus: HydrationStatus;

  if ("hydrationState" in model) {
    hydrationStatus = model.hydrationState.status;
    needsHydration = hydrationStatus === "needs hydration";
  } else {
    hydrationStatus = getHydrationStatus(model);
    needsHydration = !model.isHydrated && !model.isLoading && !model.error;
  }

  useEffect(() => {
    if (needsHydration) {
      model.hydrate();
    }
  }, [model, needsHydration]);

  const transitions = useTransition(hydrationStatus, null, crossFade);

  return (
    <Wrapper className={className}>
      {transitions.map(({ item, key, props }) => {
        switch (item) {
          case "needs hydration":
          case "loading":
          case "pending":
            return (
              <StatusWrapper key={key} style={props}>
                <Loading />
              </StatusWrapper>
            );
          case "failed":
            return (
              <StatusWrapper key={key} style={props}>
                <ErrorMessage />
              </StatusWrapper>
            );
          case "hydrated":
            return (
              <ContentWrapper key={key} style={props}>
                {children}
              </ContentWrapper>
            );
          default:
            return assertNever(item);
        }
      })}
    </Wrapper>
  );
}

export default observer(ModelHydrator);
