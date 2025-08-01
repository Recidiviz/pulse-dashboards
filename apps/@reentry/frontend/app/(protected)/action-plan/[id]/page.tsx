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
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { $api } from "@/app/api";
import Planner from "@/app/components/action-plan/Planner";
import SidePanel from "@/app/components/action-plan/SidePanel";
import UpdateResource from "@/app/components/action-plan/UpdateResource";
import LoadingState from "@/app/components/auth/LoadingState";
import LoadingSpinner from "@/app/components/base/LoadingSpinner";
import { useExecutionPolling } from "@/app/hooks/useExecutionPolling";
import { useAuth } from "@/app/lib/auth";
import type { components } from "@/app/recidiviz-schema";
import { showErrorToast, showSuccessToast } from "@/app/utils/toast";
type ResourceType = components["schemas"]["Resource"];

const ActionPlanPage = () => {
	const { id }: { id: string } = useParams();
	const { getAccessToken } = useAuth();

	// ----------- Loading and regeneration reloading ------------
	const [regenerationMessage, setRegenerationMessage] = useState("");
	const {
		isPolling,
		isCompleted,
		progress,
		message,
		error: errorPolling,
		startPolling,
		startTime,
	} = useExecutionPolling({ interval: 5000 });

	const {
		data: dataDetailPlan,
		refetch: refetchDetailPlan,
		error: errorDetailPlan,
		isLoading: isLoadingDetailPlan,
	} = $api.useQuery("get", "/plans/by_client/{client_id}", {
		params: {
			path: {
				client_id: id,
			},
		},
		headers: {
			Authorization: `Bearer ${getAccessToken()}`,
			"Content-Type": "application/json",
		},
	});

	useEffect(() => {
		// Check if there's an active generation in progress
		const latestGeneration = dataDetailPlan?.latest_generation;
		const generationInProgress =
			latestGeneration?.status === "in_progress" ||
			latestGeneration?.status === "pending";

		// If generation is in progress and we have an execution ID, poll that
		if (generationInProgress && latestGeneration?.execution_id) {
			startPolling(latestGeneration.execution_id as string);
		}
		// Fallback to create execution for initial plan creation
		else if (
			(dataDetailPlan?.create_status === "in_progress" ||
				dataDetailPlan?.create_status === "pending") &&
			dataDetailPlan?.create_execution_id
		) {
			startPolling(dataDetailPlan.create_execution_id as string);
		}
	}, [
		dataDetailPlan?.create_status,
		dataDetailPlan?.create_execution_id,
		dataDetailPlan?.latest_generation,
		startPolling,
	]);

	//----------- Resources --------------

	const [openResourceSection, setOpenResourceSection] = useState(false);
	const [relatedResourcesLoading, setRelatedResourcesLoading] = useState(false);

	const [relatedResources, setRelatedResources] = useState<ResourceType[]>([]);
	const [planResources, setPlanResources] = useState<ResourceType[]>([]);

	// The selected resource, from the plan or the list.
	const [selectedResource, setSelectedResource] = useState<ResourceType | null>(
		null,
	);
	// The resource to maybe switch to
	const [candidateResource, setCandidateResource] =
		useState<ResourceType | null>(null);

	// Get current plan resources - from the API instead of parsing from markdown
	const { data: planResourcesData, refetch: refetchPlanResources } =
		$api.useQuery("get", "/plans/{id}/resources", {
			params: {
				path: {
					id: dataDetailPlan?.id as string,
				},
			},
			headers: {
				Authorization: `Bearer ${getAccessToken()}`,
				"Content-Type": "application/json",
			},
			enabled: !!dataDetailPlan?.id, // Only enable when plan ID is available
		});

	useEffect(() => {
		if (planResourcesData) {
			setPlanResources(planResourcesData);
		}
	}, [planResourcesData]);

	useEffect(() => {
		if (isCompleted) {
			refetchDetailPlan();
			refetchPlanResources();
		}
	}, [isCompleted, refetchDetailPlan, refetchPlanResources]);

	// Mutation for searching resources with client info
	const { mutateAsync: searchResourcesMutation } = $api.useMutation(
		"post",
		"/plans/{id}/search-resources",
	);

	// Function to load related resources using search-resources endpoint with client info
	const loadRelatedResources = async (
		resource: components["schemas"]["Resource"],
	) => {
		if (!dataDetailPlan) return;
		try {
			const searchResult = await searchResourcesMutation({
				params: {
					path: {
						id: dataDetailPlan?.id, // Use plan ID, not client ID
					},
				},
				body: {
					category: resource.category,
					subcategory: resource.subcategory,
					exclude: [resource.id], // Exclude the current resource
				},
				headers: {
					Authorization: `Bearer ${getAccessToken()}`,
					"Content-Type": "application/json",
				},
			});

			if (searchResult.resources) {
				setRelatedResources(searchResult.resources);
				setRelatedResourcesLoading(false);
			}
		} catch (error) {
			console.error("Error loading related resources:", error);
			setRelatedResources([]);
			setRelatedResourcesLoading(false);
		}
	};

	const handleSelectResource = (resource: ResourceType | string) => {
		let foundResource: ResourceType | undefined;
		if (typeof resource === "string") {
			foundResource = planResources.find((r) => r.id === resource);
			if (!foundResource) {
				showErrorToast("Failed to find resource in the plan");
				return;
			}
		} else {
			foundResource = resource;
		}
		if (
			selectedResource?.category !== foundResource?.category ||
			selectedResource?.subcategory !== foundResource?.subcategory
		) {
			setSelectedResource(foundResource);
			loadRelatedResources(foundResource);
			setRelatedResourcesLoading(true);
			setOpenResourceSection(true);
		} else {
			if (typeof resource === "string") {
				setSelectedResource(foundResource);
			} else {
				setCandidateResource(foundResource);
			}
		}
	};

	const handleOpenResourceSection = () => {
		setOpenResourceSection(!openResourceSection);
	};

	const { mutateAsync: updateResourceMutation } = $api.useMutation(
		"post",
		"/plans/{id}/generate",
	);

	const handleUpdateResource = async () => {
		try {
			if (candidateResource === null || selectedResource === null) {
				showErrorToast(
					"Failed to update the resource, Missing initial or selected resource.",
				);
				return;
			}
			const response = await updateResourceMutation({
				params: {
					path: {
						id: dataDetailPlan?.id as string,
					},
				},
				body: {
					resource_to_remove_id: selectedResource.id,
					resource_to_add_content: candidateResource,
				},
				headers: {
					Authorization: `Bearer ${getAccessToken()}`,
					"Content-Type": "application/json",
				},
			});
			if (response.execution_id) {
				setRegenerationMessage(
					`Replacing ${selectedResource.name} with ${candidateResource.name}. `,
				);
				startPolling(response.execution_id);
				setSelectedResource(null);
				setCandidateResource(null);
				setRelatedResources([]);
				setOpenResourceSection(false);
				showSuccessToast(
					`Updating the action plan with the new resource: ${candidateResource.name}. `,
				);

				// After resource update is complete, refresh plan resources
				await refetchPlanResources();
			} else {
				console.log("Missing execution_id in response");
				showErrorToast("Failed to update the resource");
			}
		} catch (error) {
			console.log(error);
			showErrorToast("Failed to update the resource");
		}
	};

	if (isLoadingDetailPlan) return <LoadingState />;
	if (!dataDetailPlan?.id)
		return (
			<div className="flex flex-col items-center space-y-4 w-full h-full justify-center ">
				<span className="text-[#003331] text-lg font-medium">
					Failed to generate the plan, please try again or contact support.
				</span>
			</div>
		);
	return (
		<div className={"bg-white w-full screen:h-[calc(100vh-65px)]"}>
			<div className="w-full h-full justify-start items-start inline-flex">
				<SidePanel
					clientRecord={dataDetailPlan.client_record}
					planId={dataDetailPlan.id}
					startPolling={startPolling}
					setRegenerationMessage={setRegenerationMessage}
					selectedResource={selectedResource}
					candidateResource={candidateResource}
					relatedResourcesLoading={relatedResourcesLoading}
					planResources={planResources}
					handleSelectResource={handleSelectResource}
					relatedResources={relatedResources}
					handleOpenResourceSection={handleOpenResourceSection}
					openResourceSection={openResourceSection}
					setOpenResourceSection={setOpenResourceSection}
					dataDetailPlan={dataDetailPlan}
					isPolling={isPolling}
				/>
				{!isPolling &&
					dataDetailPlan.create_status === "completed" &&
					dataDetailPlan.latest_generation && (
						<Planner
							refetchDetailPlan={refetchDetailPlan}
							handleSelectResource={handleSelectResource}
							planId={dataDetailPlan?.id}
							clientId={id as string}
							planPrompt={dataDetailPlan?.latest_generation?.prompt || ""}
							clientFullName={
								dataDetailPlan?.client_record?.full_name
									? `${dataDetailPlan.client_record.full_name.given_names} ${dataDetailPlan.client_record.full_name.surname}`
									: ""
							}
							markDownText={
								dataDetailPlan?.latest_generation?.markdown_result || ""
							}
						/>
					)}
				{isPolling && (
					<LoadingSpinner
						progress={progress || 0}
						message={message || ""}
						startTime={startTime || 0}
						regenerationInProgress={isPolling}
						regenerationMessage={regenerationMessage}
					/>
				)}
				{!isLoadingDetailPlan && errorDetailPlan && (
					<div className="flex flex-col items-center space-y-4 w-full h-full justify-center ">
						<div className="text-[#003331] text-lg font-medium">
							An error occured, plan may not have been started for this client.
						</div>
					</div>
				)}
				{!isLoadingDetailPlan &&
					(dataDetailPlan?.create_status === "failed" || errorPolling) && (
						<div className="flex flex-col items-center space-y-4 w-full h-full justify-center ">
							<span className="text-[#003331] text-lg font-medium">
								Failed to generate the plan, please try again or contact
								support.
							</span>
						</div>
					)}
			</div>
			{candidateResource &&
				selectedResource &&
				candidateResource.id !== selectedResource?.id && (
					<UpdateResource
						candidateResource={candidateResource}
						selectedResource={selectedResource}
						onUpdate={handleUpdateResource}
						onCancel={() => setCandidateResource(null)}
					/>
				)}
		</div>
	);
};

export default ActionPlanPage;
