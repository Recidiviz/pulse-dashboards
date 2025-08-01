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

import Markdown from "markdown-to-jsx";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { $api } from "@/app/api";
import ProfileDetail from "@/app/components/action-plan/ProfileDetail";
import PrimaryButton from "@/app/components/buttons/PrimaryButton";
import { useExecutionPolling } from "@/app/hooks/useExecutionPolling";
import { useAuth } from "@/app/lib/auth";

import styles from "./markdown.module.css";

const IntakeSummaryPage = () => {
	const { id } = useParams();
	const { isPolling, progress, startPolling } = useExecutionPolling({
		interval: 4000,
	});
	const router = useRouter();

	const {
		data: dataPlan,
		refetch: refetchPlan,
		error: errorPlan,
	} = $api.useQuery("get", "/plans/by_client/{client_id}", {
		params: {
			path: {
				client_id: id as string,
			},
		},
		headers: {
			Authorization: `Bearer ${useAuth().getAccessToken()}`,
			"Content-Type": "application/json",
		},
	});

	const { data: intakeSummary, error: errorIntakeSummary } = $api.useQuery(
		"get",
		"/plans/{id}/assets/by_filename/{filename}",
		{
			params: {
				path: {
					id: dataPlan?.id as string,
					filename: "summary.md",
				},
				query: {
					include_data: true,
				},
			},
			headers: {
				Authorization: `Bearer ${useAuth().getAccessToken()}`,
				"Content-Type": "application/json",
			},
			enabled: !!dataPlan?.id,
		},
	);

	useEffect(() => {
		if (
			dataPlan?.create_status === "in_progress" ||
			dataPlan?.create_status === "pending"
		) {
			startPolling(dataPlan.create_execution_id as string);
		}
	}, [dataPlan, refetchPlan, startPolling]);

	const givenNames = dataPlan?.client_record?.full_name?.given_names || "";
	const surname = dataPlan?.client_record?.full_name?.surname || "";
	const clientFullName =
		givenNames && surname
			? `${givenNames} ${surname}`
			: givenNames || surname || "";

	useEffect(() => {
		if (!isPolling && progress === 100) {
			refetchPlan();
		}
	}, [isPolling, progress, refetchPlan]);

	return (
		<div className={"bg-white w-full screen:h-[calc(100vh-65px)]"}>
			<div className="w-[25%] h-auto self-stretch bg-white  flex-col justify-start items-center gap-2 inline-flex print:hidden">
				<div className="self-stretch h-full flex-col justify-start items-start flex">
					<ProfileDetail clientRecord={dataPlan?.client_record} />
				</div>
			</div>
			<div className="w-[75%] h-full grow shrink basis-0 self-stretch px-14 py-8 bg-white flex-col justify-start items-center gap-2 inline-flex overflow-y-auto  border-l border-[#2b5469]/20">
				<div className="mx-auto w-full max-w-[800px] h-full flex-col justify-start items-center gap-8 flex">
					<div className="w-full grow shrink basis-0 flex-col justify-start items-center gap-8 flex">
						<div className="w-full justify-end items-center gap-2 inline-flex print:hidden">
							<PrimaryButton
								buttonText="View Action Plan"
								onClick={() => router.push(`/action-plan/${id}`)}
							/>
						</div>
						<div className="w-full h-full justify-start items-start inline-flex">
							{(errorPlan || errorIntakeSummary) && (
								<div className="flex flex-col items-center space-y-4 w-full h-full justify-center">
									<div className="text-lg text-[#003331] font-medium">
										{errorPlan && (
											<div>An error occurred, unable to load the plan</div>
										)}
										{errorIntakeSummary && (
											<div>
												An error occurred, unable to load the intake summary
											</div>
										)}
									</div>
								</div>
							)}
							{intakeSummary && (
								<div>
									<div className="w-full flex-col justify-start items-center gap-3 flex">
										<div className="w-full text-[#2a5469]/90 text-sm font-medium leading-[16.80px]">
											Intake Summary
										</div>
										<div className="w-full text-[#003331] text-3xl font-medium">
											{clientFullName}
										</div>
									</div>
									<Markdown className={`${styles.markdown} my-4`}>
										{intakeSummary?.data || ""}
									</Markdown>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default IntakeSummaryPage;
