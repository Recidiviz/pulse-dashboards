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
import type { FC } from "react";

import { useSocket } from "@/app/websockets/IntakeSocketContext";

interface SidebarProps {
	onClose: () => void;
}

type StepStatus = "completed" | "in_progress" | "not_started";

interface StepIndicatorProps {
	status: StepStatus;
	hasNext: boolean;
	text: string;
	description: string;
}

const Sidebar: FC<SidebarProps> = ({ onClose }) => {
	const {
		intakeContext: { allSections },
	} = useSocket();

	const StepIndicator: FC<StepIndicatorProps> = ({
		status,
		hasNext,
		text,
		description,
	}) => {
		const isCompleted = status === "completed";
		const isInProgress = status === "in_progress";

		const renderStatusIcon = () => {
			if (isCompleted) {
				return (
					<div className="flex items-center justify-center bg-[#25636F] w-6 h-6 rounded-full border border-[#25636F] flex-shrink-0">
						<svg
							className="w-[12px] h-[18px] text-white"
							viewBox="0 0 24 24"
							fill="none"
						>
							<title>Check Mark</title>
							<path
								d="M4 13l5 6L15 5"
								stroke="currentColor"
								strokeWidth="4"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
				);
			}

			return (
				<div
					className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isInProgress ? "" : "bg-[#F9FAFA] border border-[#E9EDED]"}`}
					style={
						isInProgress
							? {
									boxShadow: "0px 0px 0px 3px #D5ECF1",
									backgroundColor: "#25636F",
								}
							: {}
					}
				>
					<div
						className={`rounded-full ${isInProgress ? "w-2 h-2 bg-white" : "w-2 h-2 bg-slate-200"}`}
					/>
				</div>
			);
		};

		const getConnectorColor = () => {
			if (isCompleted || isInProgress) return "bg-[#25636F]";
			return "bg-slate-200";
		};

		return (
			<div className="flex flex-row items-start gap-1 w-full mb-0.5">
				<div className="flex flex-col items-center w-6 min-h-[50px] gap-0">
					{renderStatusIcon()}
					{hasNext && (
						<div
							className={`w-0.5 ${getConnectorColor()}`}
							style={{
								height: "38px",
								marginTop: "3px",
								borderRadius: "1px",
							}}
						/>
					)}
				</div>

				<div className="flex flex-col gap-0.3 pt-0.3 pb-1.5 flex-1 w-full">
					<h3 className="text-sm font-bold leading-snug tracking-tight text-[#012322]">
						{text}
					</h3>
					<p className="font-public text-sm font-medium leading-snug tracking-tight text-[#2B5469D9] w-full">
						{description}
					</p>
				</div>
			</div>
		);
	};

	return (
		<div className="w-[90%] h-[90%] flex flex-col overflow-hidden ml-5">
			<div className="flex items-center justify-between p-2 mr-2 mb-6">
				<div className="w-[80px] h-[28px] sm:w-[60px] sm:h-[20px]">
					<Image
						src="/images/brand.svg"
						alt="Brand logo"
						width={80}
						height={28}
						priority
						className="w-full h-full object-contain"
					/>
				</div>

				{/* Close button - only visible on mobile/tablet */}
				<button
					type="button"
					onClick={onClose}
					className="p-2 rounded-full hover:bg-slate-100 md:hidden"
					aria-label="Close sidebar"
				>
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
						role="img"
						aria-hidden="true"
					>
						<title>Close Icon</title>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			{/* Steps section */}
			<div className="overflow-y-auto p-2">
				{allSections.map((section, index) => {
					let status: StepStatus = "not_started";
					if (section.completion_status === "completed") {
						status = "completed";
					} else if (section.completion_status === "in_progress") {
						status = "in_progress";
					}

					const hasNext = index < allSections.length - 1;

					return (
						<StepIndicator
							key={section.intake_section.title}
							status={status}
							hasNext={hasNext}
							text={section.intake_section.title}
							description={section.intake_section.description}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default Sidebar;
