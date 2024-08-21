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

import "./StatusMessage.scss";

import React from "react";

type Props = {
  icon: React.ReactElement;
  title: string;
  subtitle?: string | React.ReactElement;
  children: React.ReactNode;
};

export const StatusMessage: React.FC<Props> = ({
  icon,
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="StatusMessage">
      {icon}
      <div className="StatusMessage__title">{title}</div>
      <div className="StatusMessage__subtitle">{subtitle}</div>
      <div className="StatusMessage__content">{children}</div>
    </div>
  );
};
