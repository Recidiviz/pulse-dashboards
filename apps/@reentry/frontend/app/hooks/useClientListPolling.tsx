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

import { useEffect, useRef, useState } from "react";

interface UseClientListPollingProps {
	interval?: number;
	onRefresh?: () => void;
}

export const useClientListPolling = ({
	interval = 2000,
	onRefresh,
}: UseClientListPollingProps) => {
	const [isPolling, setIsPolling] = useState(false);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const startPolling = () => {
		if (isPolling) return; // Prevent multiple polling instances

		setIsPolling(true);

		pollingIntervalRef.current = setInterval(() => {
			onRefresh?.();
		}, interval);
	};

	const stopPolling = () => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		setIsPolling(false);
	};

	// Cleanup the interval on unmount
	useEffect(() => {
		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
			}
		};
	}, []);

	return {
		isPolling,
		startPolling,
		stopPolling,
	};
};
