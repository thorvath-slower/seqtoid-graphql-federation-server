import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import {
  getExampleQuery,
  getSampleResponse,
} from "../../tests/utils/ExampleQueryFiles";
import { getMeshInstance } from "../../tests/utils/MeshInstance";

import * as httpUtils from "../../utils/httpUtils";
jest.mock("../../utils/httpUtils");

jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "postWithCSRF");

beforeEach(() => {
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
  (httpUtils.get as jest.Mock).mockClear();
});

describe("createAsynBulkDownload Query", () => {
  let execute: ExecuteMeshFn;
  let query: string;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    // Load createAsyncBulkDownload example query
    ({ execute } = mesh$);
    query = getExampleQuery("create-bulk-download-query");
  });

  beforeEach(() => {
    (httpUtils.postWithCSRF as jest.Mock).mockClear();
    (httpUtils.get as jest.Mock).mockClear();
  });

  describe("createAsyncBulkDownload - with nextGen OFF", () => {
    const createBulkDownloadResponse = getSampleResponse("fedBulkDownload");

    it("should give correct response", async () => {
      (httpUtils.postWithCSRF as jest.Mock).mockReturnValueOnce(
        createBulkDownloadResponse,
      );
      const result = await execute(query, {
        authenticityToken: "authtoken1234",
        downloadType: "consensus_genome_intermediate_output_files",
        downloadFormat: "Separate Files",
        workflow: "consensus_genome",
        workflowRunIds: [1991, 2007],
        workflowRunIdsStrings: ["1991", "2007"],
      });
      expect(result.data.createAsyncBulkDownload).toEqual({
        id: "448",
      });
    });
  });
});
