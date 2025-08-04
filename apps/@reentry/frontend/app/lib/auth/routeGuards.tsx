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

import { usePathname } from "next/navigation";
import React, { type ReactNode } from "react";

import EmailVerificationState from "@/app/components/auth/EmailVerificationState";
import LoadingState from "@/app/components/auth/LoadingState";
import UnauthorizedState from "@/app/components/auth/UnauthorizedState";

import { useAuth } from "./authContext";

interface ProtectedRouteProps {
	children: ReactNode;
	requireVerifiedEmail?: boolean;
}

/**
 * IMPORTANT NOTE:
 * We're using this custom `ProtectedRoute` component instead of directly wrapping content
 * with `AuthWall` from the `@recidiviz/auth` library because `AuthWall` immediately redirects
 * unauthenticated users to the login page.
 *
 * This behavior may not be appropriate or expected in all user flows, especially during
 * application initialization or when verifying user states like email verification or
 * role-based access.
 *
 * To maintain full control over the auth flow and avoid abrupt redirections,
 * we first initialize our custom `authStore` in `useAuth()` and render proper fallback
 * components (`LoadingState`, `UnauthorizedState`, `EmailVerificationState`) accordingly.
 */

export const ProtectedRoute = ({
	children,
	requireVerifiedEmail = false,
}: ProtectedRouteProps) => {
	const { state } = useAuth();
	const pathname = usePathname();

	if (state.isLoading) {
		return <LoadingState />;
	}

	// Not authorized, redirect to login
	if (!state.isAuthorized) {
		// Store the current path to redirect back after login
		if (typeof window !== "undefined") {
			sessionStorage.setItem("auth_redirect", pathname);
		}
		return <UnauthorizedState />;
	}

	// Email verification required but not verified
	if (requireVerifiedEmail && !state.emailVerified) {
		return <EmailVerificationState />;
	}

	// All requirements met, render the protected content
	return <>{children}</>;
};

export default ProtectedRoute;
