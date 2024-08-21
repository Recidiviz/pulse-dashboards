import type { FastifyInstance, FastifyRequest } from "fastify";

import type { Props } from "~fastify-data-import-plugin/common/types";
import { ObjectIdentifier } from "~fastify-data-import-plugin/common/types";
const HANDLE_IMPORT_ROUTE_DEFAULT_NAME = "/handle_import";
const TRIGGER_IMPORT_ROUTE_DEFAULT_NAME = "/trigger_import";

interface PubsubBodyType {
  message?: {
    attributes: {
      bucketId: string;
      objectId: string;
    };
  };
}

interface TaskBodyType {
  bucketId: string;
  objectId: string;
}

export abstract class ImportRoutesHandlerBase {
  props;

  /**
   * @param props - The properties for the ImportRoutesHandlerBase. See the Props type for more information.
   */
  constructor(props: Props) {
    this.props = props;
  }

  /**
   * Verifies that Google ID token provided in the Authorization header is valid and is for the provided email.
   */
  abstract verifyGoogleIdToken(
    authorizationHeaders: string | undefined,
    email: string,
  ): Promise<void>;

  /**
   * Retrieves data from GCS for the provided object identifier.
   */
  abstract getDataFromGCS(
    objectIdentifier: ObjectIdentifier,
  ): Promise<unknown[]>;

  /**
   * Schedules the import of data from GCS for the provided object identifier.
   */
  abstract scheduleHandleImportCloudTask(
    bucketId: string,
    objectId: string,
  ): Promise<void>;

  /**
   * Adds the import routes to the Fastify server.
   *
   * Adds routes that handle the Pub/Sub messages that trigger an import of a file from GCS, and the actual import of the data from the file.
   *
   * The routes require a bearer token to be provided in the Authorization header, which is then verified against the provided IAM email.
   *
   * @param server - The Fastify server instance.
   */
  public registerImportRoutes(server: FastifyInstance) {
    const {
      etlHelperGetter,
      exceptionHandler,
      triggerImportArgs,
      handleImportArgs,
    } = this.props;

    const {
      iamEmail: triggerImportIamEmail,
      routeName: triggerImportRouteName = TRIGGER_IMPORT_ROUTE_DEFAULT_NAME,
    } = triggerImportArgs;

    const {
      iamEmail: handleImportIamEmail,
      routeName: handleImportRouteName = HANDLE_IMPORT_ROUTE_DEFAULT_NAME,
    } = handleImportArgs;

    /**
     * Handles Pub/Sub messages that trigger an import of a file from GCS.
     *
     * While we log the errors with the provided exception handler, we always return a
     * response of 200 when there is an internal error, otherwise Pub/Sub will retry
     * the message repeatedly.
     */
    server.post(
      triggerImportRouteName,
      async (req: FastifyRequest<{ Body: PubsubBodyType }>, res) => {
        try {
          await this.verifyGoogleIdToken(
            req.headers.authorization,
            triggerImportIamEmail,
          );
        } catch (e) {
          let message = e;
          if (e instanceof Error) {
            message = e.message;
          }

          exceptionHandler(`error verifying auth token: ${message}`);
          return;
        }

        if (
          !req.body.message?.attributes ||
          !req.body.message.attributes.bucketId ||
          !req.body.message.attributes.objectId
        ) {
          exceptionHandler(`invalid Pub/Sub message format`);
          return;
        }

        const { bucketId, objectId } = req.body.message.attributes;

        // Make sure the object type is valid before proceeding
        if (!etlHelperGetter({ bucketId, objectId })) {
          exceptionHandler(
            `Unsupported bucket + object pair: ${bucketId}/${objectId}`,
          );
          return;
        }

        console.log(
          `Received valid notification for the update of object ${objectId} from bucket ${bucketId}. Scheduling import task.`,
        );

        try {
          await this.scheduleHandleImportCloudTask(bucketId, objectId);
        } catch (e) {
          let message = e;
          if (e instanceof Error) {
            message = e.message;
          }

          exceptionHandler(`error scheduling import task: ${message}`);
          return;
        }

        res
          .status(200)
          .send("File update acknowledged and import is scheduled.");
      },
    );

    /**
     * Handles the import of data from a file from GCS.
     *
     * While we log the errors with the provided exception handler, we always
     * return the appropriate response code when there is an internal error in * case it can be resolved with a retry by the task caller.
     */
    server.post(
      handleImportRouteName,
      async (req: FastifyRequest<{ Body: TaskBodyType }>, res) => {
        try {
          await this.verifyGoogleIdToken(
            req.headers.authorization,
            handleImportIamEmail,
          );
        } catch (e) {
          res.status(401);

          let message = e;
          if (e instanceof Error) {
            message = e.message;
          }

          exceptionHandler(`error verifying auth token: ${message}`);
          return;
        }

        const { bucketId, objectId } = req.body;
        console.log(
          `Received notification for import of object ${objectId} from bucket ${bucketId}`,
        );

        const etlHelper = etlHelperGetter({ bucketId, objectId });

        if (etlHelper === undefined) {
          res.status(400);
          exceptionHandler(
            `Unsupported bucket + object pair: ${bucketId}/${objectId}`,
          );
          return;
        }

        try {
          const data = await this.getDataFromGCS({ bucketId, objectId });
          await etlHelper(data);
        } catch (e) {
          res.status(500);

          let message = e;
          if (e instanceof Error) {
            message = e.message;
          }

          exceptionHandler(
            `Error importing object ${objectId} from bucket ${bucketId}: ${message}`,
          );
          return;
        }

        console.log(
          `Import of object ${objectId} from bucket ${bucketId} completed.`,
        );

        res
          .status(200)
          .send(
            `Import of object ${objectId} from bucket ${bucketId} completed.`,
          );
      },
    );
  }
}
