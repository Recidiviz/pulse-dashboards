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
    onRowsPerPageChange?: (newRowsPerPage: number) => void;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
   currentPage,
   totalRows,
   rowsPerPage,
   onRowsPerPageChange,
}) => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const onPageChange = (newPage: number) => {
        // Update URL with new page number
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`?${params.toString()}`);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newRowsPerPage = Number(event.target.value);
        const params = new URLSearchParams(searchParams);
        params.set("size", newRowsPerPage.toString());
        params.set("page", "1"); // Reset to first page when changing rows per page
        router.push(`?${params.toString()}`);

        if (onRowsPerPageChange) {
            onRowsPerPageChange(newRowsPerPage);
        }
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

    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalRows);

    return (
        <div className="w-full p-3 bg-white flex flex-col sm:flex-row justify-center items-center gap-3">
            {/* Rows per page selector */}
            <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Rows per page:</span>
                <select
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    className="border rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#006c67]"
                >
                    {[10, 20, 30, 50].map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="disabled:opacity-50 hover:opacity-70 transition-opacity"
                    type="button"
                    aria-label="Previous page"
                >
                    <Image
                        src="/images/left_arrow.svg"
                        alt="previous row"
                        width={8}
                        height={8}
                        priority
                    />
                </button>
                <div className="text-[#006c67] text-sm font-medium leading-[16.80px] whitespace-nowrap">
                    Showing {startRow}-{endRow} of {totalRows}
                </div>
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="disabled:opacity-50 hover:opacity-70 transition-opacity"
                    aria-label="Next page"
                >
                    <Image
                        src="/images/right_arrow.svg"
                        alt="next row"
                        width={8}
                        height={8}
                        priority
                    />
                </button>
            </div>
        </div>
    );
};

export default CustomPagination;