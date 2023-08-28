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

import React from "react";
import { Link, useLocation } from "react-router-dom";

import { useRootStore } from "../../components/StoreProvider";
import { convertToSlug } from "../../utils/navigation";
import { DASHBOARD_PATHS, DASHBOARD_VIEWS } from "../views";

type Props = {
  note: string;
  chartTitle: string;
  isLoading?: boolean;
};

type LinkProps = {
  pathname: string;
  hash: string;
  search: string;
};

const ChartNote: React.FC<Props> = ({
  note,
  chartTitle,
  isLoading = false,
}) => {
  const { pathname } = useLocation();
  const view = pathname.split("/")[1];
  const {
    tenantStore: { currentTenantId },
  } = useRootStore();

  const pathwaysLinkProps: LinkProps = {
    pathname: `${DASHBOARD_PATHS.methodologySystem}`,
    hash: convertToSlug(chartTitle || ""),
    search: `?stateCode=${currentTenantId}`,
  };

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
      {view === DASHBOARD_VIEWS.system && (
        <Link
          className="ChartNote__link"
          to={pathwaysLinkProps}
          target="_blank"
        >
          See full methodology →
        </Link>
      )}
    </div>
  );
};

export default ChartNote;
