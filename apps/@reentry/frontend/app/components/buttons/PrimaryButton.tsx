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

import type React from "react";

import { useAuthUserCapabilities } from "~@reentry/frontend/contexts/AuthUserCapabilitiesContext";

interface ButtonProps {
  className?: string;
  buttonText?: string | React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  ignoreCapabilities?: boolean;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  className = "",
  buttonText,
  onClick,
  disabled = false,
  ignoreCapabilities = false,
}) => {
  const { isReadOnlyUser } = useAuthUserCapabilities();

  // Capability-based restrictions (unless ignored)
  const capabilityRestricted = !ignoreCapabilities && isReadOnlyUser;

  // Final computed disabled state
  const isDisabled = disabled || capabilityRestricted;

  return (
    <button
      type={"button"}
      onClick={onClick}
      disabled={isDisabled}
      className={`h-8 px-4 py-2 rounded-[32px] border border-[#345262]/20 justify-center items-center gap-2 inline-flex
    	transition-colors duration-300 text-[13px] font-medium leading-none
    	${
        isDisabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "hover:bg-gray-500 hover:text-white text-[#345262]/90"
      }
    	${className}`}
    >
      {buttonText}
    </button>
  );
};
