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
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";

interface CustomPaginationProps {
	currentPage: number;
	totalRows: number;
	rowsPerPage: number;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
	currentPage,
	totalRows,
	rowsPerPage,
}) => {
	const searchParams = useSearchParams();
	const router = useRouter();

	const onPageChange = (newPage: number) => {
		// Update URL with new page number
		const params = new URLSearchParams(searchParams);
		params.set("page", newPage.toString());
		router.push(`?${params.toString()}`);
	};

	const totalPages = Math.ceil(totalRows / rowsPerPage);
	const handlePrevious = () => {
		if (currentPage > 1) {
			onPageChange(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (currentPage < totalPages) {
			onPageChange(currentPage + 1);
		}
	};

	return (
		<div className="w-full p-3 bg-white justify-center items-center gap-3 inline-flex">
			<button
				onClick={handlePrevious}
				disabled={currentPage === 1}
				className="disabled:opacity-50"
				type={"button"}
			>
				<Image
					src="/images/left_arrow.svg"
					alt="previous row"
					width={8}
					height={8}
					priority
				/>
			</button>
			<div className="text-[#006c67] text-sm font-medium leading-[16.80px]">
				Showing {(currentPage - 1) * rowsPerPage + 1}-
				{Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows}
			</div>
			<button
				type={"button"}
				onClick={handleNext}
				disabled={currentPage === totalPages}
				className="disabled:opacity-50"
			>
				<Image
					src="/images/right_arrow.svg"
					alt="previous row"
					width={8}
					height={8}
					priority
				/>
			</button>
		</div>
	);
};

export default CustomPagination;
