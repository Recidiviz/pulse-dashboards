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

import { useEffect, useState } from "react";

const LoadingSpinner = ({
  message,
  startTime,
  regenerationInProgress,
  regenerationMessage,
}: {
  progress: number;
  message: string;
  startTime: number;
  regenerationInProgress?: boolean;
  regenerationMessage?: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startDate = new Date(startTime);
    const interval = setInterval(() => {
      const now = new Date();
      const secondsElapsed = Math.floor(
        (now.getTime() - startDate.getTime()) / 1000,
      );
      setElapsedTime(secondsElapsed);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [startTime]);

  return (
    <div className="flex flex-col items-center text-center space-y-4 w-full h-full justify-center">
      <p
        className={
          "flex justify-center items-center mb-4 text-[#2b5469]/70 text-base"
        }
      >
        {regenerationInProgress && regenerationMessage}
      </p>
      <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-4" />
      <p
        className={
          "flex justify-center items-center mb-4 text-[#2b5469]/70 text-base px-2 md:px-0 "
        }
      >
        <>{message}</>
      </p>
    </div>
  );
};

export default LoadingSpinner;
