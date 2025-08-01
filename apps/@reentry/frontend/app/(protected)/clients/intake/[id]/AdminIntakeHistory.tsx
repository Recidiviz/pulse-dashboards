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

import { ChevronRight, MessageSquare } from "lucide-react";
import React, { useEffect, useRef,useState } from "react";

import Chatbubble from "@/app/(protected)/clients/intake/[id]/Chatbubble";
import Sidebar from "@/app/(protected)/clients/intake/[id]/Sidebar";
import type { components } from "@/app/recidiviz-schema";

type ClientRecord = components["schemas"]["ClientRecordResponse"];
type Intake = components["schemas"]["IntakeWithSectionsResponse"];
type ClientIntakeSection = components["schemas"]["ClientIntakeSectionResponse"];

const StatusPill = ({ status }: { status: string }) => {
	const statusStyles = {
		completed: "bg-green-100 text-green-800",
		in_progress: "bg-yellow-100 text-yellow-800",
		not_started: "bg-gray-100 text-gray-800",
	};

	const labelMap = {
		completed: "Completed",
		in_progress: "In Progress",
		not_started: "Not Started",
	};

	return (
		<span
			className={`ml-2 px-2 py-0.5 text-xs rounded-full ${statusStyles[status]}`}
		>
			{labelMap[status]}
		</span>
	);
};

const AdminIntakeHistory = ({
	clientRecord,
	intake,
}: {
	clientRecord: ClientRecord;
	intake: Intake;
}) => {
	const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [containerHeight, setContainerHeight] = useState<number | null>(null);
	const sidebarRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (intake?.client_intake_sections?.length && !currentSectionId) {
			setCurrentSectionId(intake.client_intake_sections[0].id);
		}
	}, [intake, currentSectionId]);

	useEffect(() => {
		if (sidebarRef.current && sidebarOpen) {
			const measureHeight = () => {
				// Check if we're on md or larger screens
				const isMdOrLarger = window.matchMedia("(min-width: 768px)").matches;

				if (isMdOrLarger) {
					// On md+ screens, constrain height to sidebar
					const sidebarHeight = sidebarRef.current?.scrollHeight || 0;
					const minHeight = 500;
					setContainerHeight(Math.max(minHeight, sidebarHeight + 50)); // +50 for padding
				} else {
					// On smaller screens, let it grow naturally
					setContainerHeight(null);
				}
			};

			// Measure after render
			setTimeout(measureHeight, 0);

			// Listen for screen size changes
			const mediaQuery = window.matchMedia("(min-width: 768px)");
			mediaQuery.addEventListener("change", measureHeight);

			return () => mediaQuery.removeEventListener("change", measureHeight);
		}
	}, [sidebarOpen, intake?.client_intake_sections]);

	const sections: ClientIntakeSection[] = intake.client_intake_sections || [];

	return (
		<div
			className="mx-auto bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row overflow-hidden"
			style={containerHeight ? { height: `${containerHeight}px` } : undefined}
		>
			{/* Sidebar */}
			{sidebarOpen ? (
				<div className="flex-none" ref={sidebarRef}>
					<Sidebar
						onClose={() => setSidebarOpen(!sidebarOpen)}
						activeSectionId={currentSectionId}
						onSectionSelect={(sectionId) => {
							setCurrentSectionId(sectionId);
						}}
						intakeData={sections}
					/>
				</div>
			) : (
				<div className="flex items-start pt-4 flex-none">
					<button
						onClick={() => setSidebarOpen(true)}
						className="p-2 hover:bg-gray-100 rounded-md transition-colors"
						aria-label="Show sidebar"
						type="button"
					>
						<ChevronRight className="h-5 w-5 text-gray-600" />
					</button>
				</div>
			)}

			{/* Chat Panel */}
			<div className="pl-4 flex-col flex-1 min-h-0 transition-all duration-300">
				{currentSectionId ? (
					sections
						.filter((section) => section.id === currentSectionId)
						.map((section) => (
							<div key={section.id} className="flex flex-col h-full min-h-0">
								<div className="flex items-center pb-4 border-b flex-shrink-0">
									<h2 className="text-lg font-medium">
										{section.intake_section.title}
										<StatusPill status={section.completion_status} />
									</h2>
								</div>
								<div className="flex-1 min-h-0 overflow-hidden">
									<Chatbubble
										section={section}
										intakeId={intake.id}
										isActive={true}
										client={clientRecord}
									/>
								</div>
							</div>
						))
				) : (
					<div className="flex flex-col items-center justify-center h-full text-gray-500">
						<MessageSquare size={48} className="mb-4 text-gray-300" />
						<p className="text-lg font-medium mb-2">
							Select a section to view messages
						</p>
						<p className="text-sm text-center">
							Choose a section from the sidebar to see the conversation history
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminIntakeHistory;
