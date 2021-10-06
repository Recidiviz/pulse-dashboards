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
import "./Methodology.scss";

import React from "react";
import { useHistory, useParams } from "react-router-dom";

import { useRootStore } from "../../components/StoreProvider";
import MethodologyPathways from "../MethodologyPathways";
import MethodologyProjections from "../MethodologyProjections";

const PageMethodology: React.FC = () => {
  const { userStore, tenantStore } = useRootStore();
  const { userHasAccess } = userStore;
  const { dashboard }: { dashboard: string } = useParams();
  const { push, location } = useHistory();

  const stateCode = new URLSearchParams(location.search).get("stateCode");
  if (stateCode && userHasAccess(stateCode)) {
    tenantStore.setCurrentTenantId(stateCode);
  }

  const methodologies: { [k: string]: React.FC } = {
    practices: MethodologyPathways,
    projections: MethodologyProjections,
    pathways: MethodologyPathways,
  };

  const Methodology = methodologies[dashboard];

  if (!Methodology || (stateCode && !userHasAccess(stateCode))) {
    push({ pathname: "/" });
  }

  return <Methodology />;
};

export default PageMethodology;
