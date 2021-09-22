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
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect } from "react";
import { animated, useTransition } from "react-spring/web.cjs";
import styled from "styled-components/macro";

import { Hydratable } from "./models/types";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
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
/**
 * Creates an atomic status variable for transitions
 */
function getHydrationStatus(model: Hydratable): "pending" | "error" | "done" {
  if (model.isLoading || model.isLoading === undefined) {
    return "pending";
  }
  if (model.error) {
    return "error";
  }
  return "done";
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
  model: Hydratable;
};

/**
 * Observes the provided model and only renders `children` if it is hydrated;
 * otherwise renders a loading state. Also initiates hydration of the model
 * if it is not already pending.
 */
const ModelHydrator = ({
  children,
  model,
}: ModelHydratorProps): React.ReactElement => {
  // this is fine, mobx autoruns don't need dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    autorun(() => {
      if (model.isLoading === undefined) {
        model.hydrate();
      }
    })
  );

  const transitions = useTransition(getHydrationStatus(model), null, crossFade);

  return (
    <Wrapper>
      {transitions.map(({ item, key, props }) => {
        switch (item) {
          case "pending":
            return (
              <StatusWrapper key={key} style={props}>
                <Loading />
              </StatusWrapper>
            );
          case "error":
            return (
              <StatusWrapper key={key} style={props}>
                {/* <HydrationError /> */}
                Error
              </StatusWrapper>
            );
          case "done":
            return (
              <animated.div key={key} style={props}>
                {children}
              </animated.div>
            );
          default:
            return null;
        }
      })}
    </Wrapper>
  );
};

export default observer(ModelHydrator);
