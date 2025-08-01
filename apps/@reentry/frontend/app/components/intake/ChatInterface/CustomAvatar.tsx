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

import { Avatar } from "@mui/material";
import Image from "next/image";
import type React from "react";

import { useSocket } from "@/app/websockets/IntakeSocketContext";

interface AvatarProps {
	size?: number;
	name?: string;
}

const getInitials = (fullName: string): string =>
	fullName
		? fullName
				.split(" ")
				.slice(0, 2)
				.map((n) => n.charAt(0).toUpperCase())
				.join("")
		: "";

export const ClientAvatar: React.FC<AvatarProps> = ({ size = 32, name }) => {
	const {
		intakeContext: { client_name },
	} = useSocket();

	const clientName = client_name || name;
	const userInitials = getInitials(clientName as string);

	return (
		<Avatar
			sx={{
				width: size,
				height: size,
			}}
			variant="circular"
			className={`
        ring-1 ring-transparent ring-inset
        shadow-[0_0_11.74px_rgba(0,0,0,0.12)]
        rounded-full flex items-center justify-center z-[1]
      `}
			style={{
				background: "linear-gradient(20turn,#285386 35%, #a2d1db 100%)",
				backgroundBlendMode: "darken",
			}}
		>
			<span className="font-public font-bold text-[14px] leading-[24px] tracking-[0.02em] text-center text-[rgba(255,255,255,1)] top-2">
				{userInitials}
			</span>
		</Avatar>
	);
};

export const CaseWorkerAvatar: React.FC = () => (
	<div className="relative w-[32px] h-[32px] bg-[#FFF] rounded-full flex items-center justify-center border-[0.5px] gap-2">
		<Image
			src="/favicon.ico"
			alt="caseworker"
			width={22}
			height={22}
			priority
		/>
	</div>
);
