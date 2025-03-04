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
