/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import "./VizPathways.scss";

import cn from "classnames";
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  latestUpdate?: string;
  className?: string;
  legend?: React.ReactNode;
  withPadding?: boolean;
};

const VizPathways: React.FC<Props> = ({
  title,
  subtitle,
  latestUpdate,
  className,
  legend,
  withPadding = true,
  children,
}) => {
  return (
    <div className={cn("VizPathways", className)}>
      <div className="VizPathways__header">
        <div className="VizPathways__title">
          {title} {latestUpdate && <span> as of {latestUpdate}</span>}
          {subtitle && <div className="VizPathways__subtitle">{subtitle}</div>}
        </div>
        {legend}
      </div>
      <div
        className={cn({
          VizPathways__content: withPadding,
        })}
      >
        {children}
      </div>
    </div>
  );
};

export default VizPathways;
