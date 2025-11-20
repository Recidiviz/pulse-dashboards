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

"use client";

import { MenuIcon, XIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";

import { ChatHeader } from "~@reentry/frontend-shared";

interface MainLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ sidebar, content }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="relative max-w-full overflow-x-hidden">
        <ChatHeader />

        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md lg:hidden"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className="relative flex-1 flex overflow-hidden">
        <div
          className={`
            hidden lg:block
            fixed md:relative
            inset-y-0 left-0
            z-50
            w-[280px] md:flex-[0_0_30%]
            bg-white
            shadow-lg md:shadow-none
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "block" : "hidden"}
          `}
        >
          <div className="h-full">{sidebar}</div>
        </div>

        <div
          className={`
						${sidebarOpen ? "block" : "hidden"}
						lg:hidden
						fixed inset-0
						bg-black/50
						z-40
						transition-opacity duration-300
					`}
          onClick={() => setSidebarOpen(false)}
        />

        <div className="flex-1 w-full bg-[#F9FAFA] overflow-auto">
          {content}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
