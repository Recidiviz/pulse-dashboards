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

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import Image from "next/image";

import { $api } from "~@reentry/frontend/api";
import { useClientDelete } from "~@reentry/frontend/hooks/useClientDelete";
import { useClientReset } from "~@reentry/frontend/hooks/useClientReset";
import { useAuth } from "~@reentry/frontend/lib/auth";
import type { components } from "~@reentry/frontend/recidiviz-schema";
import { isFeatureEnabled } from "~@reentry/frontend/utils/featureFlagsRuntime";

interface DropdownProps {
  client: components["schemas"]["ClientResponse"];
  isOpen: boolean;
  onToggle: () => void;
  onRefetch: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null> | null;
  setIsDeletingClient?: (isDeleting: boolean) => void;
}

const ActionButton: React.FC<DropdownProps> = ({
  client,
  isOpen,
  onToggle,
  onRefetch,
  dropdownRef,
  setIsDeletingClient,
}) => {
  const { getAccessToken } = useAuth();

  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    placement: "bottom-end",
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ["top-end", "bottom-start", "top-start"],
        fallbackStrategy: "bestFit",
      }),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  // Mutation for retry processing
  const { mutateAsync: retryProcessingMutation, isPending: isRetrying } =
    $api.useMutation("post", "/clients/{client_pseudo_id}/retry-processing");

  const { handleResetClient, isResettingInProgress } = useClientReset();
  const { handleDeleteClient, isDeletingInProgress } = useClientDelete();

  const handleRetryProcessing = async () => {
    try {
      console.log(
        "Starting retry processing for client:",
        client.client_pseudo_id,
      );

      await retryProcessingMutation({
        params: {
          path: {
            client_pseudo_id: client.client_pseudo_id,
          },
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Retry processing initiated");
      // Trigger immediate refetch - this will start global polling if client becomes in_progress
      setTimeout(onRefetch, 1000);
    } catch (error) {
      console.error("Error retrying processing:", error);
    }
  };

  const handleMenuItemClick = (callback?: () => void) => {
    return () => {
      if (callback) {
        callback();
      }
      if (isOpen) {
        onToggle();
      }
    };
  };

  const buttonClasses = `flex justify-end items-end w-full focus:outline-none hover:bg-gray-300 ${
    isOpen ? "bg-blue-100 rounded-md" : ""
  }`;

  return (
    <div className="relative inline-block text-left w-full">
      {/* The button */}
      <button
        ref={refs.setReference}
        type="button"
        className={buttonClasses}
        onClick={onToggle}
        data-dropdown-toggle="true"
      >
        <Image
          src="/images/action_button.svg"
          alt="action button"
          width={20}
          height={20}
          priority
        />
      </button>

      {/* The dropdown menu */}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: "12rem",
              zIndex: 9999,
              boxShadow: "0 0 20px 4px rgba(0, 0, 0, 0.2)",
            }}
            className="absolute rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
            {...getFloatingProps()}
          >
            <div
              ref={dropdownRef}
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              {/* Show "Retry Processing" button if processing needs retry */}
              {(client.processing_status === "needs_retry" ||
                client.processing_status === "failed") && (
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  role="menuitem"
                  onClick={handleMenuItemClick(handleRetryProcessing)}
                  disabled={isRetrying}
                >
                  {isRetrying ? "Retrying..." : "Retry Processing"}
                </button>
              )}

              {/* Show links if there is a plan */}
              {client.plans && (
                <>
                  <a
                    href={`/intake-summary/${client.client_pseudo_id}`}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    Intake Summary
                  </a>
                  <a
                    href={`/action-plan/${client.client_pseudo_id}`}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    role="menuitem"
                  >
                    Action Plan
                  </a>
                </>
              )}

              <a
                href={`/clients/intake/${client.client_pseudo_id}`}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                Client Intake
              </a>

              {isFeatureEnabled("INTAKE_RESET") &&
                client.frontend_status !== "new" && (
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-200"
                    role="menuitem"
                    onClick={handleMenuItemClick(() => {
                      handleResetClient(client.client_pseudo_id, onRefetch);
                    })}
                    disabled={isResettingInProgress}
                  >
                    {isResettingInProgress ? "Resetting..." : "Reset Client"}
                  </button>
                )}

              {isFeatureEnabled("CLIENT_DELETION") &&
                client.client &&
                (() => {
                  const clientData = client.client;
                  return (
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-200"
                      role="menuitem"
                      onClick={handleMenuItemClick(() => {
                        handleDeleteClient(
                          clientData.full_name.given_names,
                          clientData.full_name.surname,
                          clientData.birthdate,
                          onRefetch,
                          setIsDeletingClient,
                        );
                      })}
                      disabled={isDeletingInProgress}
                    >
                      {isDeletingInProgress ? "Deleting..." : "Delete Client"}
                    </button>
                  );
                })()}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
};

export default ActionButton;
