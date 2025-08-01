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

import { Avatar, Typography } from "@mui/material";
import type React from "react";

const getInitials = (client): string => {
	if (!client?.full_name) return "";
	return client.full_name.given_names.charAt(0).toUpperCase();
};

interface ClientAvataProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	client: any;
	className?: string;
}

export const ClientAvatar: React.FC<ClientAvataProps> = ({
	client,
	className,
}) => {
	const clientInitials = getInitials(client);
	return (
		<Avatar
			variant="circular"
			className={`
         bg-gradient-to-r from-[#4C6290] to-[#90AEB5]
         shadow-[0_0_12.74px_rgba(0,0,0,0.25)]
         w-4 h-4 rounded-full flex items-center justify-center relative z-[1]
         ${className || ""}
       `}
		>
			<Typography
				component="span"
				className="[font-family:'Public Sans',sans-serif] font-bold text-sm leading-6 tracking-[0.02em] text-center text-white"
			>
				{clientInitials}
			</Typography>
		</Avatar>
	);
};
