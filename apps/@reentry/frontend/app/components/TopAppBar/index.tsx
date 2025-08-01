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

import SearchIcon from "@mui/icons-material/Search";
import { AppBar, Avatar, Toolbar } from "@mui/material";
import { deepPurple } from "@mui/material/colors";

const TopAppBar = () => {
	return (
		<AppBar
			className="bg-transparent"
			position="fixed"
			sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
		>
			<Toolbar className="!bg-[#f9f9f9]">
				<div className="w-full flex flex-row justify-between">
					<div>
						<SearchIcon
							fontSize="large"
							className="text-[18px]"
							sx={{ color: deepPurple[500] }}
						/>
					</div>
					<div className="flex flex-row items-center">
						<p className="text-gray-500 mr-[50px]">
							Data last updated at : {new Date().toDateString()}
						</p>
						<span className="text-[#6b5b83] text-[18px] font-bold mr-[15px]">
							User name
						</span>
						<Avatar sx={{ bgcolor: deepPurple[500] }}>K</Avatar>
					</div>
				</div>
			</Toolbar>
		</AppBar>
	);
};

export default TopAppBar;
