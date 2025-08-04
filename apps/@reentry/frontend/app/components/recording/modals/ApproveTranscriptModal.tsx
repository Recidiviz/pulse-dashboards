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

import { X } from "lucide-react";
import type React from "react";

import PrimaryButton from "@/app/components/buttons/PrimaryButton";

interface ApproveTranscriptModalProps {
	open: boolean;
	onClose: () => void;
	onApprove: () => void;
}

const ApproveTranscriptModal: React.FC<ApproveTranscriptModalProps> = ({
	open,
	onClose,
	onApprove,
}) => {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
			<div className="w-[410px] bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_0px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_0px_rgba(43,84,105,0.10)] inline-flex flex-col justify-start items-end overflow-hidden">
				{/* Header */}
				<div className="self-stretch px-4 py-3 border-b border-[#2b5469]/20 inline-flex justify-between items-center">
					<div className="text-[#002321] text-base font-medium leading-tight font-['Public_Sans']">
						Approve Transcript
					</div>
					<button
						className="p-1 hover:bg-gray-100 rounded"
						onClick={onClose}
						type="button"
						aria-label="Close modal"
					>
						<X size={14} className="text-[#004D48]" />
					</button>
				</div>

				{/* Body */}
				<div className="self-stretch p-4 flex flex-col justify-start items-start gap-5">
					<div className="self-stretch text-[#2a5469]/90 text-sm font-medium leading-[16.80px] font-['Public_Sans']">
						Once approved, you won&apos;t be able to edit the transcript
						further.
					</div>

					{/* Buttons */}
					<div className="self-stretch inline-flex justify-start items-start gap-3">
						<PrimaryButton buttonText="Continue Editing" onClick={onClose} />
						<PrimaryButton
							buttonText="Approve Transcript"
							className="flex-1 h-8 px-4 py-2 bg-[#006c67] rounded-[32px] flex justify-center items-center gap-2 text-white text-[13px] font-medium font-['Public_Sans'] leading-none"
							onClick={() => onApprove()}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ApproveTranscriptModal;
