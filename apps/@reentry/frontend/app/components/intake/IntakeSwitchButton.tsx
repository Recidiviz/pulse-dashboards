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

import { styled } from "@mui/material/styles";
import Switch, { type SwitchProps } from "@mui/material/Switch";

const IntakeSwitch = styled((props: SwitchProps) => (
	<Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
	width: 42,
	height: 26,
	padding: 0,
	"& .MuiSwitch-switchBase": {
		padding: 0,
		margin: 2,
		transitionDuration: "300ms",
		"&.Mui-checked": {
			transform: "translateX(16px)",
			color: "#fff",
			"& + .MuiSwitch-track": {
				backgroundColor: "#65C466",
				opacity: 1,
				border: 0,
				...(theme.palette.mode === "dark" && {
					backgroundColor: "#2ECA45",
				}),
			},
			"&.Mui-disabled + .MuiSwitch-track": {
				opacity: 0.5,
			},
		},
		"&.Mui-focusVisible .MuiSwitch-thumb": {
			color: "#33cf4d",
			border: "6px solid #fff",
		},
		"&.Mui-disabled .MuiSwitch-thumb": {
			color: theme.palette.grey[100],
			...(theme.palette.mode === "dark" && {
				color: theme.palette.grey[600],
			}),
		},
		"&.Mui-disabled + .MuiSwitch-track": {
			opacity: 0.7,
			...(theme.palette.mode === "dark" && {
				opacity: 0.3,
			}),
		},
	},
	"& .MuiSwitch-thumb": {
		boxSizing: "border-box",
		width: 22,
		height: 22,
	},
	"& .MuiSwitch-track": {
		borderRadius: 13,
		backgroundColor: "#E9E9EA",
		opacity: 1,
		transition: theme.transitions.create(["background-color"], {
			duration: 500,
		}),
		...(theme.palette.mode === "dark" && {
			backgroundColor: "#39393D",
		}),
	},
}));

export default IntakeSwitch;
