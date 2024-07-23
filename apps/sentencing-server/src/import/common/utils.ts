import { FILE_NAME_TO_FILE_TYPE } from "~sentencing-server/import/common/constants";

export function getFileType(objectId: string) {
  // The object id looks like <state_code>/<file_name>
  // For now, the state code is always Idaho, so we can ignore that
  const fileName = objectId.split("/").pop();

  if (!fileName || FILE_NAME_TO_FILE_TYPE[fileName] === undefined) {
    throw Error(`Invalid object id: ${objectId}`);
  }

  return FILE_NAME_TO_FILE_TYPE[fileName];
}
