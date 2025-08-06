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

import { Typography } from "@mui/material";

import type {
  ClientRecordResponse,
  RecordingSessionResponse,
} from "~@reentry/frontend/types/recording";
import { formatDateMMDDYYYY } from "~@reentry/frontend/utils/index";
import { getStateName } from "~@reentry/frontend/utils/states";

interface ClientInfoPanelProps {
  clientRecord: ClientRecordResponse;
  sessionData: RecordingSessionResponse;
}

const ClientInfoPanel: React.FC<ClientInfoPanelProps> = ({
  clientRecord,
  sessionData,
}) => {
  return (
    <div className="p-6 border-r border-gray-200">
      <div className="space-y-4">
        <div>
          <Typography className="text-[12px] font-medium leading-[120%] tracking-[-0.01em] text-[#6B7280] font-['Public_Sans'] uppercase">
            Full Name
          </Typography>
          <Typography className="text-[14px] font-medium leading-[120%] tracking-[-0.01em] text-[#012322] font-['Public_Sans']">
            {clientRecord.full_name
              ? `${clientRecord.full_name.given_names} ${clientRecord.full_name.surname}`
              : "N/A"}
          </Typography>
        </div>

        <div>
          <Typography className="text-[12px] font-medium leading-[120%] tracking-[-0.01em] text-[#6B7280] font-['Public_Sans'] uppercase">
            Birth Date
          </Typography>
          <Typography className="text-[14px] font-medium leading-[120%] tracking-[-0.01em] text-[#012322] font-['Public_Sans']">
            {clientRecord.birthdate
              ? formatDateMMDDYYYY(new Date(clientRecord.birthdate))
              : "N/A"}
          </Typography>
        </div>

        <div>
          <Typography className="text-[12px] font-medium leading-[120%] tracking-[-0.01em] text-[#6B7280] font-['Public_Sans'] uppercase">
            State
          </Typography>
          <Typography className="text-[14px] font-medium leading-[120%] tracking-[-0.01em] text-[#012322] font-['Public_Sans']">
            {clientRecord.state_code
              ? getStateName(clientRecord.state_code)
              : "N/A"}
          </Typography>
        </div>

        <div>
          <Typography className="text-[12px] font-medium leading-[120%] tracking-[-0.01em] text-[#6B7280] font-['Public_Sans'] uppercase">
            Session Created
          </Typography>
          <Typography className="text-[14px] font-medium leading-[120%] tracking-[-0.01em] text-[#012322] font-['Public_Sans']">
            {formatDateMMDDYYYY(new Date(sessionData.created_at))}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoPanel;
