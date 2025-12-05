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

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import React from "react";

import BackButton from "~@reentry/frontend/components/base/BackButton";

const NavRecordingPage = ({client_pseudo_id, safeNavigate}: {client_pseudo_id: string, safeNavigate: ((path: string) => void) | null}) => {

  return (
    <nav className="w-full h-[65px] px-6 bg-white border-b border-[#2b5469]/20 justify-between items-center inline-flex print:hidden">
      <div className="grow shrink basis-0 h-[65px] justify-between items-center flex">
        <div className="pr-6 justify-start items-center gap-4 flex">
            <BackButton href={`/clients/intake/${client_pseudo_id}`} buttonText={"Back"} onClick={() => safeNavigate?.(`/clients/intake/${client_pseudo_id}`)}/>
        </div>
        <div className="pl-6 justify-start items-center gap-4 flex">
        </div>
      </div>
    </nav>
  );
};

export default NavRecordingPage;
