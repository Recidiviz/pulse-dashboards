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
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import { $api } from "@/app/api";
import LastPrompt from "@/app/components/action-plan/LastPrompt";
import ActionPlanViewer from "@/app/components/ActionPlanViewer";
import PrimaryButton from "@/app/components/buttons/PrimaryButton";
import { useAuth } from "@/app/lib/auth";
import { showErrorToast, showSuccessToast } from "@/app/utils/toast";

interface PlannerProps {
	markDownText: string;
	planPrompt: string;
	clientFullName: string;
	clientId: string;
	planId: string;
	refetchDetailPlan: () => void;
	handleSelectResource: (resourceName: string) => void;
}

const Planner = ({
	markDownText,
	planPrompt,
	clientFullName,
	clientId,
	planId,
	refetchDetailPlan,
	handleSelectResource,
}: PlannerProps) => {
	const { getAccessToken } = useAuth();
	const [markDownPlan, setMarkdownPlan] = useState<string>(markDownText);
	const [update, setUpdate] = useState(false);
	const [internalMarkdown, setInternalMarkdown] = useState<string>("");
	const contentRef = useRef<HTMLDivElement | null>(null);
	const reactToPrintFn = useReactToPrint({ contentRef });
	const router = useRouter();

	useEffect(() => {
		setMarkdownPlan(markDownText);
	}, [markDownText]);

	const { mutateAsync: generatePlanMutation /*, isError: generatePlanError*/ } =
		$api.useMutation("post", "/plans/{id}/edit");

	const postprocessMarkdown = (markdown) => {
		// Replace ReadOnlyLink with a markdown link [example.md](example.com)
		return markdown.replace(
			/<ReadOnlyLink\s+[^>]*href='([^"]+)'[^>]*>([\s\S]*?)<\/ReadOnlyLink>/g,
			(_, href, text) => `[${text.trim()}](${href})`,
		);
	};

	const saveEdit = async () => {
		try {
			const processedMarkdown = postprocessMarkdown(internalMarkdown);

			await generatePlanMutation({
				params: {
					path: {
						id: planId as string,
					},
				},
				body: {
					markdown: processedMarkdown,
				},
				headers: {
					Authorization: `Bearer ${getAccessToken()}`,
					"Content-Type": "application/json",
				},
			});
			refetchDetailPlan();
			showSuccessToast("Action plan updated successfully");
			setMarkdownPlan(processedMarkdown);
			setUpdate(false);
		} catch {
			showErrorToast("Failed to update action plan");
		}
	};

	const cancelEdit = () => {
		const processedMarkdown = postprocessMarkdown(markDownPlan);
		setInternalMarkdown(processedMarkdown);
		setUpdate(false);
	};

	const handleDownload = async () => {
		const element = document.getElementById("contentToDownload");
		if (!element) return;

		// get the element to change the style provisionally while generating the PDF
		const elementsToHide = [
			...document.querySelectorAll(".notes"),
			...document.querySelectorAll(".annotations"),
			...document.querySelectorAll("img"),
		];
		const annotationsLinks = document.querySelectorAll(".custom-link");

		// tried to use forEach but biome checker was very annoying about it, and deactivating the rule didn't work
		for (const element of elementsToHide) {
			element.setAttribute("style", "display: none !important");
		}
		for (const annotationLink of annotationsLinks) {
			annotationLink.setAttribute("style", "border-bottom: none !important");
		}

		const { default: html2pdf } = await import("html2pdf.js");

		const options = {
			margin: [10, 10, 10, 10],
			filename: `${clientFullName}-action-plan.pdf`,
		};

		html2pdf()
			.from(element)
			.set(options)
			.save()
			.then(() => {
				// remove the provisional styles
				for (const element of elementsToHide) {
					element.removeAttribute("style");
				}
				for (const annotationLink of annotationsLinks) {
					annotationLink.removeAttribute("style");
				}
			})
			.catch((err) => console.error(err));
	};

	return (
		<div className="w-[75%] grow shrink basis-0 self-stretch px-14 py-8 bg-white flex-col justify-start items-center gap-2 inline-flex overflow-y-auto actionPlanSide">
			<div className="mx-auto max-w-[800px] h-full flex-col justify-start items-center gap-8 flex">
				<div className="w-full grow shrink basis-0 flex-col justify-start items-center gap-8 flex">
					<div className="w-full justify-end items-center gap-2 inline-flex print:hidden">
						{update ? (
							<>
								<PrimaryButton buttonText="Save" onClick={saveEdit} />
								<PrimaryButton buttonText="Cancel" onClick={cancelEdit} />
							</>
						) : (
							<>
								<PrimaryButton
									className={"!w-[180px] "}
									buttonText="View Intake Summary"
									onClick={() => router.push(`/intake-summary/${clientId}`)}
								/>
								<PrimaryButton
									buttonText="Edit"
									onClick={() => setUpdate(!update)}
								/>
								<PrimaryButton buttonText="Print" onClick={reactToPrintFn} />
								<PrimaryButton buttonText="Download" onClick={handleDownload} />
							</>
						)}
					</div>
					<LastPrompt planPrompt={planPrompt} />
					<div
						ref={contentRef}
						id={"contentToDownload"}
						className="max-w-[800px]"
					>
						<div className="w-full flex-col justify-start items-center gap-3 flex">
							<div className="w-full text-[#2a5469]/90 text-sm font-medium leading-[16.80px]">
								Action plan
							</div>
							<div className="w-full text-[#003331] text-3xl font-medium">
								{clientFullName}
							</div>
						</div>
						<ActionPlanViewer
							markDownPlan={markDownPlan}
							update={update}
							internalMarkdown={internalMarkdown}
							setInternalMarkdown={setInternalMarkdown}
							handleSelectResource={handleSelectResource}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Planner;
