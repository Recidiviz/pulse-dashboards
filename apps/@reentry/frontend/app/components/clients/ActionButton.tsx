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

import {
	autoUpdate,
	flip,
	FloatingPortal,
	offset,
	shift,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react";
import Image from "next/image";

import { $api } from "@/app/api";
import { useAuth } from "@/app/lib/auth";
import type { components } from "@/app/recidiviz-schema";

interface DropdownProps {
	client: components["schemas"]["ClientResponse"];
	isOpen: boolean;
	onToggle: () => void;
	onRefetch: () => void;
}

const ActionButton: React.FC<DropdownProps> = ({
	client,
	isOpen,
	onToggle,
	onRefetch,
}) => {
	const { getAccessToken } = useAuth();

	const { x, y, strategy, refs, context } = useFloating({
		open: isOpen,
		placement: "bottom-end",
		middleware: [
			offset(5),
			flip({
				fallbackPlacements: ["top-end", "bottom-start", "top-start"],
				fallbackStrategy: "bestFit",
			}),
			shift(),
		],
		whileElementsMounted: autoUpdate,
	});

	const dismiss = useDismiss(context);
	const { getFloatingProps } = useInteractions([dismiss]);

	// Mutation for retry processing
	const { mutateAsync: retryProcessingMutation } = $api.useMutation(
		"post",
		"/clients/{client_id}/retry-processing",
	);

	const handleRetryProcessing = async () => {
		try {
			console.log("Starting retry processing for client:", client.client_id);

			await retryProcessingMutation({
				params: {
					path: {
						client_id: client.client_id,
					},
				},
				headers: {
					Authorization: `Bearer ${getAccessToken()}`,
					"Content-Type": "application/json",
				},
			});

			console.log("Retry processing initiated");
			// Trigger immediate refetch - this will start global polling if client becomes in_progress
			setTimeout(onRefetch, 1000);
		} catch (error) {
			console.error("Error retrying processing:", error);
		}
	};

	const handleMenuItemClick = (callback?: () => void) => {
		return () => {
			if (callback) {
				callback();
			}
			if (isOpen) {
				onToggle();
			}
		};
	};

	const buttonClasses = `flex justify-end items-end w-full focus:outline-none ${
		isOpen ? "bg-blue-100 rounded-md" : ""
	}`;

	return (
		<div className="relative inline-block text-left w-full">
			{/* The button */}
			<button
				ref={refs.setReference}
				type="button"
				className={buttonClasses}
				onClick={onToggle}
			>
				<Image
					src="/images/action_button.svg"
					alt="action button"
					width={20}
					height={20}
					priority
				/>
			</button>

			{/* The dropdown menu */}
			{isOpen && (
				<FloatingPortal>
					<div
						ref={refs.setFloating}
						style={{
							position: strategy,
							top: y ?? 0,
							left: x ?? 0,
							width: "12rem",
							zIndex: 9999,
							boxShadow: "0 0 20px 4px rgba(0, 0, 0, 0.2)",
						}}
						className="absolute rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
						{...getFloatingProps()}
					>
						<div
							className="py-1"
							role="menu"
							aria-orientation="vertical"
							aria-labelledby="options-menu"
						>
							{/* Show "Retry Processing" button if processing needs retry */}
							{(client.processing_status === "needs_retry" ||
								client.processing_status === "failed") && (
								<button
									type="button"
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
									role="menuitem"
									onClick={handleMenuItemClick(handleRetryProcessing)}
								>
									Retry Processing
								</button>
							)}

							{/* Show links if there is a plan */}
							{client.plans && (
								<>
									<a
										href={`/intake-summary/${client.client_id}`}
										className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
										role="menuitem"
									>
										Intake Summary
									</a>
									<a
										href={`/action-plan/${client.client_id}`}
										className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
										role="menuitem"
									>
										Action Plan
									</a>
								</>
							)}

							<a
								href={`/clients/intake/${client.client_id}`}
								className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
								role="menuitem"
							>
								Client Intake
							</a>
						</div>
					</div>
				</FloatingPortal>
			)}
		</div>
	);
};

export default ActionButton;
