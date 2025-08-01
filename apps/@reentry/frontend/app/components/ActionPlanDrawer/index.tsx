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

import { Drawer, Toolbar } from "@mui/material";

import { APP_DATA } from "@/app/constants";

import { Resources } from "./Resources";
import SectionSearch from "./SectionSearch";
const drawerWidth = "50%";
const ActionPlanDrawer = ({ markdownPlan }: { markdownPlan: string }) => {
	return (
		<Drawer
			variant="permanent"
			sx={{
				width: drawerWidth,
				flexShrink: 0,
				"& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
			}}
		>
			<Toolbar />
			<div className="flex h-full">
				<div className="w-2/3 p-5 bg-[#d9d9d9] h-full flex-grow">
					<h2 className="text-[36px] text-[#6c6c6c]">Action Plan (Draft)</h2>
					<p className="my-8 text-[18px] text-[#7c7c7c]">
						You can edit this draft inline, or have Link reformulate sections
						based on your recommendations.
					</p>
					<div className="section">
						<h3 className="font-bold mb-8">Housing resources:</h3>
						<Resources actions={APP_DATA.actions} />
					</div>
				</div>
				<div className="w-1/3">
					<SectionSearch markDownPlan={markdownPlan} />
				</div>
			</div>
		</Drawer>
	);
};

export default ActionPlanDrawer;
