export function arrayToJsonLines(arr: object[]) {
  return arr.map((obj) => JSON.stringify(obj)).join("\n");
}
