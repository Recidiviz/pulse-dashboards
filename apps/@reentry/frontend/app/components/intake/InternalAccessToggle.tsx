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
import { useState } from "react";

import { $api } from "@/app/api";
import IntakeSwitch from "@/app/components/intake/IntakeSwitchButton";
import { useAuth } from "@/app/lib/auth";
import { showErrorToast, showSuccessToast } from "@/app/utils/toast";

interface InternalAccessToggleProps {
	clientId: string;
	internalAccess?: boolean | null;
	intake?: object | null;
	onUpdate?: () => void;
	className?: string;
}

const InternalAccessToggle: React.FC<InternalAccessToggleProps> = ({
	clientId,
	internalAccess = false,
	intake,
	onUpdate,
	className = "",
}) => {
	const auth = useAuth();
	const [loading, setLoading] = useState(false);

	const { mutateAsync: generateTokenAsync } = $api.useMutation(
		"post",
		"/intake/admin/{client_id}",
	);

	const { mutateAsync: patchInternalAccess } = $api.useMutation(
		"patch",
		"/intake/admin/{client_id}/internal-access",
	);

	const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.checked;
		setLoading(true);

		try {
			if (!intake) {
				// Intake is null → create it
				await generateTokenAsync({
					params: { path: { client_id: clientId } },
					headers: {
						Authorization: `Bearer ${auth.getAccessToken()}`,
						"Content-Type": "application/json",
					},
				});
				showSuccessToast("Intake created");
			}

			await patchInternalAccess({
				params: { path: { client_id: clientId } },
				body: { internal_access: newValue },
				headers: {
					Authorization: `Bearer ${auth.getAccessToken()}`,
					"Content-Type": "application/json",
				},
			});

			showSuccessToast("Internal access updated");
			onUpdate?.();
		} catch (error) {
			showErrorToast("Failed to update internal access");
			console.error("Internal access update error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<IntakeSwitch
				checked={internalAccess ?? false}
				onChange={handleChange}
				inputProps={{ "aria-label": "Internal access toggle" }}
				disabled={loading}
			/>
		</div>
	);
};

export default InternalAccessToggle;
