import { CloudTasksClient, protos } from "@google-cloud/tasks";

export async function scheduleHandleImportCloudTask(
  bucketId: string,
  objectId: string,
) {
  const cloudTaskClient = new CloudTasksClient();

  if (
    !process.env["IMPORT_CLOUD_TASK_PROJECT"] ||
    !process.env["IMPORT_CLOUD_TASK_LOCATION"] ||
    !process.env["IMPORT_CLOUD_TASK_QUEUE"] ||
    !process.env["IMPORT_CLOUD_TASK_URL"] ||
    !process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"]
  ) {
    throw new Error("Missing required environment variables for Cloud Tasks");
  }

  const parent = cloudTaskClient.queuePath(
    process.env["IMPORT_CLOUD_TASK_PROJECT"],
    process.env["IMPORT_CLOUD_TASK_LOCATION"],
    process.env["IMPORT_CLOUD_TASK_QUEUE"],
  );

  const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
    parent: parent,
    task: {
      httpRequest: {
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify({ bucketId, objectId })),
        httpMethod: "POST",
        url: process.env["IMPORT_CLOUD_TASK_URL"],
        oidcToken: {
          serviceAccountEmail:
            process.env["IMPORT_CLOUD_TASK_SERVICE_ACCOUNT_EMAIL"],
        },
      },
    },
  };

  const [response] = await cloudTaskClient.createTask(request);

  const name = response.name;
  console.log(
    `Created task ${name} to handle import of object ${objectId} from bucket ${bucketId}`,
  );
}
