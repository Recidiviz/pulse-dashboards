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

import { ErrorBoundary, ErrorBoundaryProps } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { FC } from "react";

import { hydrationFailure } from "../Hydratable/utils";
import { Hydrator } from "./Hydrator";
import { HydratorProps } from "./types";

type ThrowingHydratorProps = Omit<HydratorProps, "failed">;

type HydratorWithErrorLoggingProps = ThrowingHydratorProps & {
  fallback: NonNullable<ErrorBoundaryProps["fallback"]>;
};

const ThrowingHydrator: FC<ThrowingHydratorProps> = observer(
  function ThrowingHydrator(hydratorProps) {
    const error = hydrationFailure(hydratorProps.hydratable);
    if (error) {
      throw error;
    }

    return (
      <Hydrator
        {...hydratorProps}
        // this should never be seen because the parent component will throw first
        failed={null}
      />
    );
  },
);

export const HydratorWithErrorLogging: FC<HydratorWithErrorLoggingProps> = ({
  fallback,
  ...hydratorProps
}) => {
  return (
    <ErrorBoundary fallback={fallback}>
      <ThrowingHydrator {...hydratorProps} />
    </ErrorBoundary>
  );
};
