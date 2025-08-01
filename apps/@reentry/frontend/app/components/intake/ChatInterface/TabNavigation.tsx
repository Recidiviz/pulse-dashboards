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

import type { FC } from "react";

interface TabNavigationProps {
	activeTab: string;
	onTabChange: (tab: string) => void;
}

const TabNavigation: FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
	return (
		<div className="border-t border-slate-200 bg-white flex justify-around">
			{/* Chat Tab */}
			<button
				type="button"
				onClick={() => onTabChange("chat")}
				className={`flex flex-col items-center py-2 px-4 flex-1 ${
					activeTab === "chat" ? "text-[#25636F]" : "text-slate-400"
				}`}
			>
				<div
					className={`h-1 w-12 mb-2 rounded-full ${activeTab === "chat" ? "bg-[#25636F]" : "bg-transparent"}`}
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					<title>Chat</title>
				</svg>
				<span className="text-xs mt-1">Chat</span>
			</button>

			{/* Progress Tab */}
			<button
				type="button"
				onClick={() => onTabChange("progress")}
				className={`flex flex-col items-center py-2 px-4 flex-1 ${
					activeTab === "progress" ? "text-[#25636F]" : "text-slate-400"
				}`}
			>
				<div
					className={`h-1 w-12 mb-2 rounded-full ${activeTab === "progress" ? "bg-[#25636F]" : "bg-transparent"}`}
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<title>progress</title>
					<line x1="12" y1="20" x2="12" y2="10" />
					<line x1="18" y1="20" x2="18" y2="4" />
					<line x1="6" y1="20" x2="6" y2="16" />
				</svg>
				<span className="text-xs mt-1">Progress</span>
			</button>
		</div>
	);
};

export default TabNavigation;
