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

import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { ComponentType, useEffect } from "react";
import { useParams } from "react-router-dom";

import { useCoreStore } from "./core/CoreStoreProvider";
import { DEFAULT_ENTITY_ID } from "./core/PagePractices/types";
import { decrypt } from "./utils/formatStrings";

type RouteParams = {
  entityId?: string;
};

type NormalizedParams = {
  entityId: string;
};

const normalizeRouteParams = (rawParams: RouteParams): NormalizedParams => {
  const { entityId: rawEntityId } = rawParams;
  const entityId =
    !rawEntityId || rawEntityId === "STATE_DOC"
      ? rawEntityId
      : decrypt(rawEntityId);
  return {
    entityId: entityId || DEFAULT_ENTITY_ID,
  };
};

/**
 * A high-order component responsible for syncing relevant route parameters
 * to the appropriate store, so it can react to navigation.
 * Passes all props through `RouteComponent`, with route parameters normalized.
 */
const withRouteSync = <Props extends RouteParams>(
  RouteComponent: ComponentType<Props>
): ComponentType<Props> => {
  const WrappedRouteComponent: React.FC<Props> = (props) => {
    const { entityId } = normalizeRouteParams(useParams());
    const { pagePracticesStore } = useCoreStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(
      action("sync route params", () => {
        pagePracticesStore.setCurrentEntityId(entityId);
      })
    );

    return <RouteComponent {...props} />;
  };

  return observer(WrappedRouteComponent);
};

export default withRouteSync;
