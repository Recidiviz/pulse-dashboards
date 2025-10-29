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

import { Chip, Tooltip, Typography } from "@mui/material";

interface BatteryLevelProps {
  batteryLevel: number | null;
}

const BatteryLevel: React.FC<BatteryLevelProps> = ({ batteryLevel }) => {
  if (batteryLevel === null) return null;

  const getBatteryColor = () => {
    if (batteryLevel < 15) return "text-red-600";
    if (batteryLevel < 25) return "text-yellow-600";
    return "text-gray-600";
  };

  const shouldShowTooltip = batteryLevel < 25;

  const getBadgeConfig = () => {
    if (batteryLevel < 15) {
      return {
        color: "error" as const,
        label: "Critical Battery",
      };
    }
    if (batteryLevel < 25) {
      return {
        color: "warning" as const,
        label: "Low Battery",
      };
    }
    return null;
  };

  const badgeConfig = getBadgeConfig();

  const batteryContent = (
    <div className="flex flex-col gap-1">
      <Typography className={`text-[10px] sm:text-xs cursor-pointer ${getBatteryColor()} lg:hidden`}>
        (Battery: {batteryLevel}%)
      </Typography>
      {badgeConfig && (
        <Chip
          label={badgeConfig.label}
          color={badgeConfig.color}
          size="small"
          className="text-[10px] lg:hidden"
        />
      )}
    </div>
  );

  if (shouldShowTooltip) {
    const tooltipMessage =
      batteryLevel < 15
        ? "Battery level is critically low. Audio recording may pause automatically to preserve battery."
        : "Battery level is low. Audio recording may pause if battery drops further.";

    return <Tooltip title={tooltipMessage}>{batteryContent}</Tooltip>;
  }

  return batteryContent;
};

export default BatteryLevel;
