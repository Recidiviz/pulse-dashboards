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

import { Box, Typography } from "@mui/material";
import type React from "react";

import { ClientAvatar } from "@/app/components/intake/ClientAvatar";

interface ChatHeaderProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	client: any;
	className?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ client, className }) => {
	return (
		<Box
			className={`flex items-center gap-2 p-4 border-b border-gray-200 bg-white ${className}`}
		>
			<ClientAvatar client={client} />
			<Typography
				component="div"
				className="font-public font-large text-[18px] leading-[160%] tracking-[-0.02em] text-[#003331]"
			>
				{client.full_name && (
					<>
						{client.full_name.given_names || ""}{" "}
						{client.full_name.surname || ""}
					</>
				)}
			</Typography>
			<Typography
				component="div"
				className="font-public font-medium text-[18px] leading-[120%] tracking-[-0.02em] text-[#8BB1BA]"
			>
				{client.doc_id}
			</Typography>
		</Box>
	);
};

export default ChatHeader;
