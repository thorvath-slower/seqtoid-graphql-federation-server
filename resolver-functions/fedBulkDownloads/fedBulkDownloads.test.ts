import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "../../tests/utils/MeshInstance";

import * as httpUtils from "../../utils/httpUtils";
import { getExampleQuery } from "../../tests/utils/ExampleQueryFiles";
jest.mock("../../utils/httpUtils");

beforeEach(async () => {
  (httpUtils.get as jest.Mock).mockClear();
});

describe("bulkDownloads Query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
    (httpUtils.get as jest.Mock).mockClear();
  });

  it("should give correct response with NO params & and a failed run", async () => {
    const query = getExampleQuery("bulk-downloads-no-limit");
    const railsResponse = [
      {
        id: 12714,
        params_json:
          '{"sample_ids":{"value":[1156]},"workflow":{"value":"amr"}}',
        download_type: "amr_combined_results_bulk_download",
        status: "error",
        error_message: null,
        user_id: 412,
        created_at: "2024-02-15T11:47:10.000-08:00",
        updated_at: "2024-02-15T11:47:17.000-08:00",
        progress: null,
        ecs_task_arn: null,
        output_file_size: null,
        description: null,
        deleted_at: null,
        analysis_type: "amr",
        analysis_count: 1,
        num_samples: 1,
        download_name: "Combined AMR Results",
        file_size: null,
        user_name: "Suzette McCanny",
        execution_type: "resque",
        log_url: null,
        params: { sample_ids: [1156], workflow: ["amr"] },
      },
    ];
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => railsResponse);
    const result = await execute(query, {});
    const bulkDownloadResponse = [
      {
        id: "12714",
        status: "FAILED",
        startedAt: "2024-02-15T11:47:10.000-08:00",
        ownerUserId: 412,
        analysisCount: 1,
        downloadType: "amr_combined_results_bulk_download",
        url: null,
        fileSize: null,
        entityInputFileType: "amr",
        entityInputs: [],
        logUrl: null,
        errorMessage: null,
        params: [],
      },
    ];
    expect(result.data.fedBulkDownloads).toEqual(bulkDownloadResponse);
  });

  it("should give correct response with url params & successful run", async () => {
    const query = getExampleQuery("bulk-downloads-with-limit");
    const railsResponse = [
      {
        id: 12715,
        download_type: "sample_taxon_report",
        status: "success",
        error_message: null,
        user_id: 412,
        created_at: "2024-02-15T11:52:57.000-08:00",
        updated_at: "2024-02-15T11:53:22.000-08:00",
        progress: 0.87,
        ecs_task_arn: null,
        output_file_size: 57197,
        description: null,
        deleted_at: null,
        analysis_type: "short-read-mngs",
        analysis_count: 3,
        num_samples: 3,
        download_name: "Sample Taxon Reports",
        file_size: "55.9 KB",
        user_name: "Suzette McCanny",
        execution_type: "resque",
        log_url: null,
        params: {
          sample_ids: { value: [24682, 25015, 25160] },
          workflow: ["short-read-mngs"],
        },
        pipeline_runs: [
          { id: 29454, sample_name: "longnamebabe" },
          { id: 29761, sample_name: "How about this" },
          { id: 29884, sample_name: "n6_n27_v6_23e" },
        ],
        workflow_runs: [],
        presigned_output_url: "https://presignedUrl.com",
      },
    ];
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => railsResponse);
    const result = await execute(query, {
      limit: 2,
      searchBy: "Suzette McCanny",
    });
    const bulkDownloadResponse = [
      {
        id: "12715",
        status: "SUCCEEDED",
        startedAt: "2024-02-15T11:52:57.000-08:00",
        ownerUserId: 412,
        downloadType: "sample_taxon_report",
        url: "https://presignedUrl.com",
        fileSize: 57197,
        entityInputFileType: "short-read-mngs",
        entityInputs: [
          {
            id: "29454",
            name: "longnamebabe",
          },
          {
            id: "29761",
            name: "How about this",
          },
          {
            id: "29884",
            name: "n6_n27_v6_23e",
          },
        ],
        logUrl: null,
        errorMessage: null,
        params: [],
      },
    ];
    expect(result.data.fedBulkDownloads).toEqual(bulkDownloadResponse);
  });
});
