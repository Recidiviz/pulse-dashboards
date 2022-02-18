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
import "./ChartNote.scss";

import { observer } from "mobx-react-lite";
import React from "react";
import { Link } from "react-router-dom";

import { convertToSlug } from "../../utils/navigation";
import { useCoreStore } from "../CoreStoreProvider";
import { PATHWAYS_PATHS } from "../views";

const ChartNote: React.FC = () => {
  const { currentTenantId, metricsStore } = useCoreStore();
  const metric = metricsStore.current;
  const { isLoading, note, chartTitle } = metric;

  if (isLoading || !note) {
    return (
      <div className="ChartNote">
        <br />
      </div>
    );
  }
  return (
    <div className="ChartNote">
      <strong>Note: </strong>
      {/* TODO add link when methodology is ready */}
      {note}
      <Link
        className="ChartNote__link"
        to={{
          pathname: `${PATHWAYS_PATHS.methodologySystem}`,
          hash: convertToSlug(chartTitle || ""),
          search: `?stateCode=${currentTenantId}`,
        }}
        target="_blank"
      >
        See full methodology →
      </Link>
    </div>
  );
};

export default observer(ChartNote);
