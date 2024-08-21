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

import "./VitalsSummaryBreadcrumbs.scss";

import cn from "classnames";
import { observer } from "mobx-react-lite";
import React from "react";
import { Link, useLocation } from "react-router-dom";

import { encrypt, toTitleCase } from "../../utils/formatStrings";
import { getPathWithoutParams } from "../../utils/navigation";
import { useCoreStore } from "../CoreStoreProvider";
import { ENTITY_TYPES } from "../models/types";
import {
  DEFAULT_ENTITY_ID,
  DEFAULT_ENTITY_NAME,
  DEFAULT_ENTITY_TYPE,
} from "../PageVitals/types";

export const DefaultEntity = {
  entityName: DEFAULT_ENTITY_ID,
  entityType: DEFAULT_ENTITY_TYPE,
  entityId: DEFAULT_ENTITY_NAME,
  parentEntityId: undefined,
};

function formatOfficeName(name: string | undefined): string | undefined {
  if (!name) return "Unknown";
  return name.includes("Office") ? name : `${toTitleCase(name)} Office`;
}

function formatOfficerName(name: string): string {
  const nameWithoutId = name.split(": ").pop();
  return nameWithoutId || name;
}

const VitalsSummaryBreadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const basePath = getPathWithoutParams(pathname);

  const { tenantStore, vitalsStore } = useCoreStore();
  const { currentEntitySummary, parentEntityName } = vitalsStore;
  const { stateName } = tenantStore;

  const { entityName, entityType, parentEntityId } =
    currentEntitySummary || DefaultEntity;
  let current;
  let state;
  let parent;

  switch (entityType) {
    case ENTITY_TYPES.LEVEL_1_SUPERVISION_LOCATION:
    case ENTITY_TYPES.LEVEL_2_SUPERVISION_LOCATION:
      current = formatOfficeName(entityName);
      state = stateName;
      parent = undefined;
      break;
    case ENTITY_TYPES.PO:
      current = formatOfficerName(entityName);
      state = stateName;
      parent = formatOfficeName(parentEntityName);
      break;
    default:
      current = stateName;
      state = undefined;
      parent = undefined;
  }

  return (
    <div className="VitalsSummaryBreadcrumbs">
      <div className="VitalsSummaryBreadcrumbs__container">
        {state ? (
          <Link className="VitalsSummaryBreadcrumbs--state" to={basePath}>
            {state}
          </Link>
        ) : (
          // Render a placeholder so the header spacing remains
          // constant with or without a state link
          <div>&nbsp;</div>
        )}
        {parent && (
          <div className="VitalsSummaryBreadcrumbs__parent-container">
            <span>/</span>
            {parentEntityId && (
              <Link
                className="VitalsSummaryBreadcrumbs--parent"
                to={`${basePath}/${encrypt(parentEntityId)}`}
              >
                {parent}
              </Link>
            )}
          </div>
        )}
      </div>
      <div
        className={cn("VitalsSummaryBreadcrumbs--current", {
          "fs-exclude": entityType === ENTITY_TYPES.PO,
        })}
      >
        {current}
      </div>
    </div>
  );
};

export default observer(VitalsSummaryBreadcrumbs);
