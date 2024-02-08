import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getBulkDownloadCGOverviewExampleQuery, getBulkDownloadCGOverviewResponse } from "./utils/ExampleQueryFiles";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
jest.mock("../utils/httpUtils");

beforeEach(() => {
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
});

describe.only("BulkDownloadCGOverview Query", () => {
  let execute: ExecuteMeshFn;
  let query: string;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    // Load BulkDownloadCGOverview example query
    ({ execute } = mesh$);
    query = getBulkDownloadCGOverviewExampleQuery();
  });

  describe("BulkDownloadCGOverview successful response", () => {
    const bulkDownloadCGOverviewResponse = JSON.parse(getBulkDownloadCGOverviewResponse());

    it("should give correct response", async () => {
      (httpUtils.postWithCSRF as jest.Mock).mockImplementation(() => bulkDownloadCGOverviewResponse);
      const result = await execute(query, {
        authenticityToken: "authtoken1234",
        downloadType: "consensus_genome_overview", 
        includeMetadata: false,
        workflow: "consensus_genome", 
        workflowRunIds: [1991, 2007]
      });
      expect(result.data.BulkDownloadCGOverview.cgOverviewRows).toStrictEqual(bulkDownloadCGOverviewResponse.cg_overview_rows);
    });
  });

});
