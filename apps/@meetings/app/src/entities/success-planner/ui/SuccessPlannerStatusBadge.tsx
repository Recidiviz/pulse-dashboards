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

import { Typography } from "~@meetings/app/shared/ui/Typography";

import { SuccessPlannerStatus } from "../model/successPlanner";

const STATUS_CLASSES: Record<SuccessPlannerStatus, string> = {
  NOT_STARTED: "bg-attention-light !text-attention",
  IN_PROGRESS: "bg-warning-light !text-warning",
  COMPLETED: "bg-brand-light !text-brand",
};

type Props = {
  status: SuccessPlannerStatus;
  label: string;
  className?: string;
};

export function SuccessPlannerStatusBadge({ status, label, className }: Props) {
  return (
    <Typography
      variant="caption-s-medium"
      className={clsx(
        "w-fit rounded-lg px-2 py-0.5",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {label}
    </Typography>
  );
}
