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
// ===================== ========================================================

import "./PathwaysLeftPanel.scss";

import React from "react";

import SectionNavigation from "../SectionNavigation";

const PathwaysLeftPanel: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  return (
    <div className="PathwaysLeftPanel">
      <div className="PathwaysLeftPanel__title">{title}</div>
      <div className="PathwaysLeftPanel__description">{description}</div>
      <SectionNavigation />
    </div>
  );
};

export default PathwaysLeftPanel;