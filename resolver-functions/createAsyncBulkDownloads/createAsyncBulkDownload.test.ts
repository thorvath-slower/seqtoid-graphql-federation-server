import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import {
  getExampleQuery,
  getSampleResponse,
} from "../../tests/utils/ExampleQueryFiles";
import { getMeshInstance } from "../../tests/utils/MeshInstance";

import * as httpUtils from "../../utils/httpUtils";
import * as enrichToken from "../../utils/enrichToken";
jest.mock("../../utils/httpUtils");
jest.mock("../../utils/enrichToken");

jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "shouldReadFromNextGen");
jest.spyOn(httpUtils, "postWithCSRF");
jest.spyOn(enrichToken, "getEnrichedToken");

beforeEach(() => {
  (httpUtils.postWithCSRF as jest.Mock).mockClear();
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
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
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
  });

  describe("createAsyncBulkDownload - with nextGen OFF", () => {
    const createBulkDownloadResponse = getSampleResponse("fedBulkDownload");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockReturnValueOnce(false);

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

  describe("createAsyncBulkDownload successful response - with nextGen ON", () => {
    const createBulkDownloadResponse = getSampleResponse("fedBulkDownload");
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockReturnValueOnce(true);
    (enrichToken.getEnrichedToken as jest.Mock).mockReturnValueOnce(
      "123123124234",
    );

    const bulkDownloadDefaultVersion = {
      data: {
        workflows: [
          {
            defaultVersion: "0.0.3",
          },
        ],
      },
    };
    const bulkDownloadVersionId = {
      data: {
        workflowVersions: [
          {
            id: "1234",
          },
        ],
      },
    };
    const getFilesFromEntities = {
      data: {
        consensusGenomes: [
          {
            intermediateOutputs: {
              id: "1234",
            },
          },
        ],
      },
    };

    const runWorkflowVersionMutation = {
      data: {
        runWorkflowVersion: {
          id: "018e9f6b-5c95-7a0d-933f-c5ab489799f6",
        },
      },
    };
    (httpUtils.get as jest.Mock).mockReturnValueOnce(
      bulkDownloadDefaultVersion,
    );
    (httpUtils.get as jest.Mock).mockReturnValueOnce(bulkDownloadVersionId);
    (httpUtils.get as jest.Mock).mockReturnValueOnce(getFilesFromEntities);
    (httpUtils.fetchFromNextGen as jest.Mock).mockReturnValueOnce(
      runWorkflowVersionMutation,
    );

    it("should give correct response", async () => {
      const result = await execute(query, {
        authenticityToken: "authtoken1234",
        downloadType: "consensus_genome_intermediate_output_files",
        downloadFormat: "Separate Files",
        workflow: "consensus_genome",
        workflowRunIds: [1991, 2007],
        workflowRunIdsStrings: ["1991", "2007"],
      });
      console.log(JSON.stringify(result));
      expect(result.data.createAsyncBulkDownload).toEqual({
        id: "018e9f6b-5c95-7a0d-933f-c5ab489799f6",
      });
    });
  });
});
