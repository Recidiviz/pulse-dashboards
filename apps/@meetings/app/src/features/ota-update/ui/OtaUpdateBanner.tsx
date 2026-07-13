// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import clsx from "clsx";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import RefreshIcon from "react-native-heroicons/solid/RefreshIcon";

import { theme } from "~@meetings/app/shared/config";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useOtaUpdate } from "../model/useOtaUpdate";

export const OtaUpdateBanner = () => {
  const { isVisible, isApplying, hasError, applyUpdate } = useOtaUpdate();

  if (!isVisible) {
    return null;
  }

  let label = "A new version is available - tap to update";
  if (isApplying) {
    label = "Updating...";
  } else if (hasError) {
    label = "Update failed - tap to try again";
  }

  return (
    <TouchableOpacity
      onPress={applyUpdate}
      disabled={isApplying}
      className={clsx(
        "flex-row items-center justify-center gap-2 px-4 py-2.5",
        hasError ? "bg-attention" : "bg-brand",
      )}
    >
      {isApplying ? (
        <ActivityIndicator size="small" color={theme["colors"]["on-brand"]} />
      ) : (
        <RefreshIcon className="size-4 fill-on-brand" />
      )}
      <Typography className="text-center text-sm font-medium text-on-brand">
        {label}
      </Typography>
    </TouchableOpacity>
  );
};
