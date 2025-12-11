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

import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";

const updateResource = ({
  onUpdate,
  onCancel,
  candidateResource,
  selectedResource,
}) => {
  return (
    <div className="fixed bottom-0 left-0 w-full p-3 shadow-2xl border-t border-gray-200 flex justify-center items-center z-50 bg-[#f9fafa]">
      <p className="text-[#003331] text-base mr-14">
        Replace resource{" "}
        <span className="font-bold">{selectedResource.name}</span> with{" "}
        <span className="font-bold">{candidateResource.name}</span>?
      </p>
      <div className="flex space-x-3">
        <PrimaryButton
          buttonText={"Yes"}
          onClick={onUpdate}
          className={`self-stretch h-8  justify-center items-center gap-2 inline-flex rounded-[32px]
          text-[13px] font-medium leading-none px-4 py-2 bg-blue-500 text-white text-sm rounded
          "hover:bg-blue-600"
          `}
          disabled={candidateResource.id === selectedResource.id}
        />
        <PrimaryButton
          buttonText="No"
          onClick={onCancel}
          ignoreCapabilities={true}
        />
      </div>
    </div>
  );
};

export default updateResource;
