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

import type { InputHTMLAttributes, ReactNode } from "react";

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
}

export function IconInput({
  startIcon,
  endIcon,
  className = "",
  ...props
}: IconInputProps) {
  const baseClasses =
    "flex items-center border border-slate-300 rounded-md px-3 bg-white text-sm w-full h-10";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      {startIcon && <div className="mr-2 text-slate-400">{startIcon}</div>}
      <input
        {...props}
        className="min-w-0 flex-1 outline-none bg-transparent placeholder:text-slate-400 h-full"
      />
      {endIcon && <div className="ml-2 text-slate-400">{endIcon}</div>}
    </div>
  );
}
