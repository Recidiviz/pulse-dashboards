import {
  testBucketId,
  testObjectId,
} from "~fastify-data-import-plugin/test/setup";

export const samplePayloadMessage = {
  attributes: {
    bucketId: testBucketId,
    objectId: testObjectId,
  },
};
