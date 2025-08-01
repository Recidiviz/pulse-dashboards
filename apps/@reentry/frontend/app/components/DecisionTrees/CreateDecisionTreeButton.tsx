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

import { useRouter } from "next/navigation";

const CreateDecisionTreeButton = () => {
	const router = useRouter();

	const handleCreate = () => {
		router.push("/decision-tree/create");
	};

	return (
		<button
			type={"button"}
			onClick={handleCreate}
			className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
		>
			Create Decision Tree
		</button>
	);
};

export default CreateDecisionTreeButton;
