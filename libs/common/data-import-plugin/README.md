# data-import-plugin

This library exports a helper class that can be used to import data from a set of files in GCS. It utilizes Readable streams and async generators to stream the data from GCS to a callback function.

## Usage

Note: If you are using this plugin with a project that uses a new prisma client, you must add that client's type to the `PrismaClient` type in `src/common/types.ts`, and add that client's `prisma-generate` as a dependency for the `typecheck` target in this project's `project.json`.

To use this plugin, you must first create an instance of the `ImportHandler` class and then call the `import` method on the instance to import files.

See `Props` in `src/common/types.ts` for a list of the required properties for the `ImportHandler`.

```ts
import { ImportHandler } from "~data-import-plugin/index";

const props: Props = {...};

const importHandler = new ImportHandler(props);

function importData(state_code: string) {
    importHandler.import(state_code);
}
```

### Rows that fail to parse

A row that doesn't match its file's schema is skipped rather than aborting the file; the errors are collected and thrown once the whole import has finished. That is a problem for a loader that treats the import as a snapshot and deletes records the latest import doesn't contain, because a record whose new data was merely unparsable looks identical to one that is genuinely gone.

Such a loader should give its file a `getRowId` and consult the `context` it is passed as a third argument:

- `context.skippedRowIds` holds the ids of rows that were present in the raw data but unparsable. If corresponding records already exist from a previous run, you may prefer to leave them stale rather than removing them.
- `context.unidentifiedSkippedRowCount` counts unparsable rows whose id couldn't be read at all. When it is above zero, there is no way to tell those rows apart from records that are gone, so you may not want to delete anything on this run.

`context` is only complete once the data generator has been drained, so read it after the loop, not while iterating.

## Testing

If you would like to test an application that uses this plugin, there is a testkit available under `src/testkit`. The testkit provides a mock handler that can be swapped in for the real one using the following snippet at the top of your test file or test setup file:

```ts
import { MockImportHandler } from "~data-import-plugin/testkit";

vi.mock("~data-import-plugin", () => ({
  ImportHandler: MockImportHandler,
}));
```

In order to stub out data that will be returned by GCS, you can use the `MockDataProvider` singleton:

```ts
import { dataProviderSingleton } from "~data-import-plugin/testkit";

const objectPath = ...

dataProviderSingleton.setData(objectPath, [
    {
        jsonDataOne: ...
    },
    {
        jsonData2: ...
    }
]);
```
