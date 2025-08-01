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

const LastPrompt = ({ planPrompt }) => {
	return (
		planPrompt && (
			<div className="relative p-2 bg-gray-50 border border-gray-300 rounded-lg shadow-md transition hover:shadow-lg w-full">
				<div className="absolute -top-2 -left-2 bg-blue-300 text-white rounded-full w-32 h-5 flex items-center justify-center text-xs font-bold">
					<div className="absolute left-1 bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
						!
					</div>
					<span className="ml-4">Your last prompt</span>
				</div>
				<p className="text-[#2b5469]/70 text-sm mx-4 my-4 font-semibold">
					{planPrompt}
				</p>
			</div>
		)
	);
};
export default LastPrompt;
