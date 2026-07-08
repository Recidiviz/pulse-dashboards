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

import { View } from "react-native";

import { useImpersonationStore } from "~@meetings/app/features/impersonation";
import { useStateSelection } from "~@meetings/app/features/state-selection";
import { Typography } from "~@meetings/app/shared/ui/Typography";

export const StatusBanners = () => {
  const { selectedStateCode } = useStateSelection();
  const { impersonatedEmail, impersonatedStateCode } = useImpersonationStore();

  return (
    <>
      {selectedStateCode === "US_DEMO" && (
        <View className="z-[-1] bg-warning-light px-4 py-2.5">
          <Typography className="text-center text-sm font-medium text-warning">
            NOTE: You are currently viewing the Demo state, which is shared
            externally to Recidiviz and our state agencies. DO NOT create
            meetings including real agency data.
          </Typography>
        </View>
      )}
      {!!impersonatedEmail && (
        <View className="z-[-1] bg-warning-light px-4 py-2.5">
          <Typography className="text-center text-sm font-medium text-warning">
            Impersonating: {impersonatedEmail} in {impersonatedStateCode}
          </Typography>
        </View>
      )}
    </>
  );
};
