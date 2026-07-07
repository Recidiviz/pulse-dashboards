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

import React from "react";
import { View } from "react-native";

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useImpersonationStore } from "../model/impersonation";

export function ImpersonationBanner() {
  const { impersonatedEmail, impersonatedStateCode } = useImpersonationStore();

  if (!impersonatedEmail) {
    return null;
  }

  return (
    <View className="z-[-1] bg-warning-light px-4 py-2.5">
      <Typography className="text-center text-sm font-medium text-warning">
        Impersonating: {impersonatedEmail} in {impersonatedStateCode}
      </Typography>
    </View>
  );
}
