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
import { useLocation, useParams } from "react-router-dom";

import { useCoreStore } from "./core/CoreStoreProvider";
import { DEFAULT_ENTITY_ID } from "./core/PagePractices/types";
import {
  DEFAULT_PATHWAYS_SECTION,
  PathwaysPage,
  PathwaysSection,
} from "./core/views";
import { decrypt } from "./utils/formatStrings";

type RouteParams = {
  sectionId?: string;
  entityId?: string;
};

type NormalizedParams = {
  sectionId: PathwaysSection;
  entityId: string;
};

const normalizeRouteParams = (rawParams: RouteParams): NormalizedParams => {
  const { entityId: rawEntityId, sectionId: rawSectionId } = rawParams;
  const entityId =
    !rawEntityId || rawEntityId === "STATE_DOC"
      ? rawEntityId
      : decrypt(rawEntityId);
  const sectionId = rawSectionId as PathwaysSection;
  return {
    entityId: entityId || DEFAULT_ENTITY_ID,
    sectionId: sectionId || DEFAULT_PATHWAYS_SECTION,
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
    const { pathname } = useLocation();
    const pageId = pathname.split("/")[2] as PathwaysPage;
    const { entityId, sectionId } = normalizeRouteParams(useParams());
    const { pagePracticesStore, setPage, setSection } = useCoreStore();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(
      action("sync route params", () => {
        pagePracticesStore.setCurrentEntityId(entityId);
        setSection(sectionId);
        setPage(pageId);
      })
    );

    return <RouteComponent {...props} />;
  };

  return observer(WrappedRouteComponent);
};

export default withRouteSync;
