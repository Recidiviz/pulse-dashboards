// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

export type GcsObjectIdentifier = { bucketId: string; objectId: string };

export type ObjectIdentifier = {
  bucketId: string;
  stateCode: string;
  fileName: string;
};

export type EtlHelper = (stateCode: string, data: unknown[]) => Promise<void>;

/**
 * A function that returns the ETL helper function for a given object identifier.
 *
 * Expects an identifier of the form { bucketId: string; stateCode: string, fileName: string } and returns
 * the ETL helper function for that object, or undefined if no such function exists.
 */
export type EtlHelperGetter = (
  identifier: ObjectIdentifier,
) => EtlHelper | undefined;

/**
 * Arguments for the trigger import route.
 * @property iamEmail - The IAM email address that is allowed to call the trigger import route. It is typically the email of the service account that triggers the GCS Pub/Sub notification.
 * @property routeName - The name of the route. Defaults to "/trigger_import".
 * @property cloudTaskProject - The GCP project ID for the Cloud Task, e.g. pulse-dashboards-staging
 * @property cloudTaskLocation - The location of the Cloud Task queue, e.g. us-central1
 * @property cloudTaskQueueName - The name of the Cloud Task queue.
 * @property cloudTaskUrl - The URL where the Cloud Task will send the POST request. Typically is the handle import route for this instance.
 * @property cloudTaskServiceAccountEmail - The service account email that will be used to trigger the cloud task.
 */
export type TriggerImportArgs = {
  iamEmail: string;
  routeName?: string;
  cloudTaskProject: string;
  cloudTaskLocation: string;
  cloudTaskQueueName: string;
  cloudTaskUrl: string;
  cloudTaskServiceAccountEmail: string;
};

/**
 * Arguments for the handle import route.
 * @property iamEmail - The IAM email address that is allowed to call the handle import route. It is typically the same as the cloudTaskServiceAccountEmail in the trigger import route.
 * @property routeName - The name of the route. Defaults to "/handle_import".
 */
export type HandleImportArgs = {
  iamEmail: string;
  routeName?: string;
};

/*
 * Props for the ImportRoutesHandlerBase class.

  * @property etlHelperGetter - A function that returns the ETL helper function for a given object identifier (see above).
  * @property exceptionHandler - A function that handles exceptions.
  * @property triggerImportArgs - Arguments for the trigger import route (see above).
  * @property handleImportArgs - Arguments for the handle import route (see above).
 */
export type Props = {
  etlHelperGetter: EtlHelperGetter;
  exceptionHandler: (e: Error | string) => void;
  triggerImportArgs: TriggerImportArgs;
  handleImportArgs: HandleImportArgs;
};
