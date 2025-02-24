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

import React from "react";

import { CaseloadSelect } from "../CaseloadSelect";
import CaseloadTypeSelect from "../CaseloadTypeSelect/CaseloadTypeSelect";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { AllCaseloads } from "./AllCaseloads";

export const CaseloadView: React.FC = () => {
  return (
    <WorkflowsNavLayout>
      <CaseloadTypeSelect />
      <CaseloadSelect />
      <AllCaseloads />
    </WorkflowsNavLayout>
  );
};
