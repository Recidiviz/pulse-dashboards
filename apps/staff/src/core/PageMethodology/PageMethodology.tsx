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

import "./PageMethodology.scss";

import React from "react";
import { AnchorProvider } from "react-anchor-navigation";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useRootStore } from "../../components/StoreProvider";
import MethodologyPathways from "../MethodologyPathways";
import MethodologyProjections from "../MethodologyProjections";

const PageMethodology: React.FC = () => {
  const { userStore, tenantStore } = useRootStore();
  const { userHasAccess } = userStore;
  const { dashboard } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stateCode = new URLSearchParams(location.search).get("stateCode");
  if (stateCode && userHasAccess(stateCode)) {
    tenantStore.setCurrentTenantId(stateCode);
  }

  const methodologies: { [k: string]: React.FC } = {
    operations: MethodologyPathways,
    projections: MethodologyProjections,
    system: MethodologyPathways,
  };

  if (!dashboard || (stateCode && !userHasAccess(stateCode))) {
    navigate("/");
    return null;
  }

  const Methodology = methodologies[dashboard];

  return (
    <AnchorProvider offset={75}>
      {/* per types this needs to be an array */}
      {[<Methodology key="methodology" />]}
    </AnchorProvider>
  );
};

export default PageMethodology;
