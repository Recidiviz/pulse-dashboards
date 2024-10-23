# fastify-data-import-plugin

This library exports a helper class that can be used add a pair of two routes to a Fastify instance.

## Usage

To use this plugin, you must first create an instance of the `ImportRoutesHandler` class and then call the `registerImportRoutes` method on the instance. The `registerImportRoutes` method will add the two routes to the Fastify instance.

See `Props` in `src/common/types.ts` for a list of the required and customizable properties that can be passed to `ImportRoutesHandler`.

```tsx
import Fastify from "fastify";

import { ImportRoutesHandler } from "~fastify-data-import-plugin/index";

const props: Props = {...};

const server = Fastify();
const importRoutesHandler = new ImportRoutesHandler(props);

importRoutesHandler.registerImportRoutes(server);
```

## Implementation details

The first route is a POST route that accepts Google Cloud Storage Pub/Sub messages for the change of a file. The route provides validation checks and then enqueues a Cloud Task to call the second route.

The second route is a POST route that accepts a Cloud Task request to import the data from the file. The route reads the file from GCS, parses it, and then sends the data to a callback function that is provided by the user.

## Testing

If you would like to test an application that uses this plugin, there is a testkit available under `src/testkit`. The testkit provides a mock handler that can be swapped in for the real one using the following snippet at the top of your test file or test setup file:

```tsx
import { MockImportRoutesHandler } from "~fastify-data-import-plugin/testkit";

vi.mock("~fastify-data-import-plugin", () => ({
  ImportRoutesHandler: MockImportRoutesHandler,
}));
```

In order to stub out data that will be returned by GCS, you can use the `MockDataProvider` singleton:

```tsx
import { dataProviderSingleton } from "~fastify-data-import-plugin/testkit";

dataProviderSingleton.setData([
    {
        jsonDataOne: ...
    },
    {
        jsonData2: ...
    }
]);
```
