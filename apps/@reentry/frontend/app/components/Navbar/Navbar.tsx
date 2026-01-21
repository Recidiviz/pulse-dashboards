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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import UserDropdown from "~@reentry/frontend/components/auth/userDropdown";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

const Navbar = () => {
  const { state, login, logout, isRecidivizUser, hasWorkflowsRoute } = useAuth();
  const pathname = usePathname();
  
  const showDashboardsLink = hasWorkflowsRoute || isRecidivizUser;

  return (
    <nav className="w-full h-[65px] px-6 bg-white border-b border-[#2b5469]/20 justify-between items-center inline-flex print:hidden">
      <div className="grow shrink basis-0 h-[65px] justify-between items-center flex">
        <div className="pr-6 justify-start items-center gap-4 flex">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/images/brand.svg"
              alt="Next.js logo"
              width={100}
              height={100}
              priority
            />
          </a>
        </div>
        <div className="pl-6 justify-start items-center gap-4 flex">
          {state.user ? (
            <>
              <div className="flex">
                {process.env["NEXT_PUBLIC_ENVIRONMENT"] !== "prod" &&
                  process.env["NEXT_PUBLIC_ENVIRONMENT"] !== "staging" && (
                    <div
                      className={`self-stretch px-1 py-6 flex-col justify-center items-center gap-2 inline-flex ${
                        pathname === "/decision-tree"
                          ? "border-t-4 border-[#00c49d] text-[#003331]"
                          : "text-[#2a5469]/90"
                      }`}
                    >
                      <Link href="/decision-tree">
                        <div
                          className={`text-sm font-medium leading-[16.80px] ${pathname === "/decision-tree" ? "mt-[-4%]" : "text-white"} `}
                        >
                          Decision <b /> trees
                        </div>
                      </Link>
                    </div>
                  )}
                <div
                  className={`self-stretch px-1 py-6 flex-col justify-center items-center gap-2 inline-flex ${
                    pathname === "/clients" ||
                    pathname.includes("/action-plan/")
                      ? "border-t-4 border-[#00c49d] text-[#003331]"
                      : "text-[#2a5469]/90"
                  }`}
                >
                  <Link href="/clients">
                    <div className=" text-sm font-medium leading-[16.80px]">
                      Clients
                    </div>
                  </Link>
                </div>
              </div>
              <UserDropdown user={state.user} onLogout={logout} showDashboardsLink={showDashboardsLink} />
            </>
          ) : (
            <>
              {!state.isLoading && (
                <div className="flex justify-end items-center gap-4">
                  <button
                    type="button"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                    onClick={() => login()}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
