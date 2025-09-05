// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import "react-loading-skeleton/dist/skeleton.css";

import React from "react";
import { SkeletonTheme } from "react-loading-skeleton";

import { palette } from "~design-system";

export const SkeletonThemeProvider: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={className}>
      <SkeletonTheme
        baseColor={palette.marble4}
        highlightColor={palette.marble2}
        borderRadius="4px"
        enableAnimation={false}
      >
        <style>{`
          .react-loading-skeleton {
            background: repeating-linear-gradient(
              -45deg,
              ${palette.slate05},
              ${palette.slate05} 10px,
              ${palette.slate20} 10px,
              ${palette.slate20} 11px
            ) !important;
          }

          .skeleton-mode {
            filter: opacity(0.6);
          }
        `}</style>
        {children}
      </SkeletonTheme>
    </div>
  );
};
