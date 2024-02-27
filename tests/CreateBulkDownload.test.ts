import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getExampleQuery, getSampleResponse } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.mock("../utils/httpUtils");

beforeEach(() => {
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
});

describe.only("CreateBulkDownload Query", () => {
  let execute: ExecuteMeshFn;
  let query: string;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    // Load CreateBulkDownload example query
    ({ execute } = mesh$);
    query = getExampleQuery("create-bulk-download-query");
  });

  describe("CreateBulkDownload successful response", () => {
    const createBulkDownloadResponse = getSampleResponse("bulkDownload");
    it("should give correct response", async () => {
      (httpUtils.postWithCSRF as jest.Mock).mockImplementation(
        () => createBulkDownloadResponse
      );
      const result = await execute(query, {
        authenticityToken: "authtoken1234",
        downloadType: "consensus_genome_intermediate_output_files",
        downloadFormat: "Separate Files",
        workflow: "consensus_genome",
        workflowRunIds: ["1991", "2007"],
      });
      expect(result.data.CreateBulkDownload).toStrictEqual(
        createBulkDownloadResponse
      );
    });
  });
});
