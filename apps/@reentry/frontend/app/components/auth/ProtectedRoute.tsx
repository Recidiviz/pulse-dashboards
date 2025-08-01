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

"use client";

import { AuthWall } from "@recidiviz/auth";
import React, { type ReactNode } from "react";

import { useAuth } from "@/app/lib/auth";

import EmailVerificationState from "./EmailVerificationState";
import LoadingState from "./LoadingState";
import UnauthorizedState from "./UnauthorizedState";

interface ProtectedRouteProps {
	children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	const { authStore } = useAuth();

	if (!authStore) {
		return <LoadingState />;
	}

	return (
		<AuthWall
			authStore={authStore}
			loading={<LoadingState />}
			unauthorizedPage={<UnauthorizedState />}
			emailVerificationPage={<EmailVerificationState />}
			handleTargetUrl={(targetUrl) => {
				console.log("Redirect to:", targetUrl);
			}}
		>
			{children}
		</AuthWall>
	);
};

export default ProtectedRoute;
