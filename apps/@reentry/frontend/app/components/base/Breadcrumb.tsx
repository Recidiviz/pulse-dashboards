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

import Link from "next/link";
import type { FC } from "react";

interface BreadcrumbItem {
	label: string;
	href: string;
}

interface BreadcrumbProps {
	routes: BreadcrumbItem[];
}

const Breadcrumb: FC<BreadcrumbProps> = ({ routes }) => {
	return (
		<nav className="flex p-4 text-gray-600" aria-label="breadcrumb">
			<ol className="inline-flex items-center space-x-1 md:space-x-3">
				{routes.map((route, index) => (
					<li key={index} className="inline-flex items-center">
						{index < routes.length - 1 ? (
							<>
								<Link
									href={route.href}
									className="text-gray-600 hover:text-gray-900 text-sm font-medium"
								>
									{route.label}
								</Link>
								<svg
									className="w-4 h-4 text-gray-400 mx-2"
									fill="currentColor"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
									role={"img"}
									aria-label={"Right chevron"}
								>
									<path
										fillRule="evenodd"
										d="M7.293 14.707a1 1 0 01-.083-1.32l.083-.094L11.586 10 7.293 5.707a1 1 0 011.32-1.497l.094.083L13.414 9.5a1 1 0 01.083 1.32l-.083.094-4.707 4.707a1 1 0 01-1.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</>
						) : (
							<span className="text-gray-500 text-sm font-medium">
								{route.label}
							</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
};

export default Breadcrumb;
