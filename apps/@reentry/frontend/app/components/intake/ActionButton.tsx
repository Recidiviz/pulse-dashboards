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

import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef } from "react";

interface DropdownProps {
	clientId: string;
	isOpen: boolean;
	onToggle: () => void;
}

const ActionButton: React.FC<DropdownProps> = ({
	clientId,
	isOpen,
	onToggle,
}) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const handleClickOutside = (event: MouseEvent) => {
		if (
			isOpen &&
			dropdownRef.current &&
			!dropdownRef.current.contains(event.target as Node)
		) {
			onToggle();
		}
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, handleClickOutside]);

	return (
		<div className="relative inline-block text-left w-full" ref={dropdownRef}>
			<button
				type={"button"}
				onClick={onToggle}
				className="flex justify-end items-end w-full focus:outline-none"
			>
				<Image
					src="/images/action_button.svg"
					alt="action button"
					width={20}
					height={20}
					priority
				/>
			</button>
			{isOpen && (
				<div className="fixed mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 right-4 xl:right-auto">
					<div
						className="py-1"
						role="menu"
						aria-orientation="vertical"
						aria-labelledby="options-menu"
					>
						<button
							type={"button"}
							onClick={() => {
								router.push(`/intake-summary/${clientId}`);
							}}
							className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
							role="menuitem"
						>
							Manage Intake
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default ActionButton;
