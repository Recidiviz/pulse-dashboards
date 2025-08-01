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

import mermaid from "mermaid";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface MermaidChartProps {
	chart: string | null;
}

mermaid.initialize({});

const MermaidVisualizer: React.FC<MermaidChartProps> = ({ chart }) => {
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const mermaidRef = useRef<HTMLDivElement>(null);

	const validMermaidChart = async (
		diagram: string | null,
	): Promise<boolean> => {
		try {
			if (!diagram) return false;
			// Try to parse the diagram to see if it's valid
			await mermaid.parse(diagram);
			return true;
		} catch {
			return false;
		}
	};

	useEffect(() => {
		const initializeMermaid = async () => {
			setLoading(true);
			const validGraph = await validMermaidChart(chart);
			if (validGraph) {
				setErrorMessage("");
				if (mermaidRef.current && chart) {
					mermaidRef.current.innerHTML = chart;
					const { svg, bindFunctions } = await mermaid.render(
						`mermaid-diagram-${Date.now()}`,
						chart,
					);
					mermaidRef.current.innerHTML = svg;
					bindFunctions?.(mermaidRef.current);
				}
			} else {
				setErrorMessage("Waiting for a valid mermaid chart...");
			}
			setLoading(false);
		};

		initializeMermaid();
	}, [chart]);

	return (
		<div className={"h-full"}>
			{loading && (
				<div className="flex text-black justify-center items-center h-full">
					Loading...
				</div>
			)}
			{!loading && errorMessage && (
				<div className="flex text-black justify-center items-center h-full">
					{errorMessage}
					<div className="flex justify-center items-center ml-2">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
					</div>
				</div>
			)}
			<div className={`${errorMessage ? "hidden" : ""}`}>
				<div id={"mermaid-graph"} ref={mermaidRef} />
			</div>
		</div>
	);
};

export default MermaidVisualizer;
