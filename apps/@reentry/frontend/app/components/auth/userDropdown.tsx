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

import { useState } from "react";

const UserDropdown = ({
	user,
	onLogout,
}: { user: { name?: string; family_name?: string }; onLogout: () => void }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="relative">
			<button
				type={"button"}
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-400"
			>
				<div className="w-8 h-8 relative rounded-lg bg-[url('/images/fk.svg')] flex items-center justify-center">
					<span className="text-white text-[14px] font-bold leading-[14px] tracking-tight">
						{user && (user.name?.[0] || "") + (user.family_name?.[0] || "")}
					</span>
				</div>
				<svg
					className="w-5 h-5 text-black hover:text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					role={"img"}
					aria-label={"Right chevron"}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
					<div className="p-1">
						<a
							href="/profile"
							className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
						>
							My Profile
						</a>
						<button
							type={"button"}
							onClick={onLogout}
							className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
						>
							Logout
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default UserDropdown;
