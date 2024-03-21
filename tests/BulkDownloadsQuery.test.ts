import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "./utils/MeshInstance";

import * as httpUtils from "../utils/httpUtils";
import { getExampleQuery } from "./utils/ExampleQueryFiles";
jest.mock("../utils/httpUtils");

beforeEach(async () => {
  (httpUtils.get as jest.Mock).mockClear();
});

describe("bulkDownloads Query:", () => {
  let execute: ExecuteMeshFn;

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
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
    const railsResponse2 = {
      bulk_download: {
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
        params: { sample_ids: { value: [1156] }, workflow: { value: "amr" } },
        pipeline_runs: [],
        workflow_runs: [{ id: 1156, sample_name: "norg_wtc" }],
        presigned_output_url: null,
      },
      download_type: {
        type: "amr_combined_results_bulk_download",
        display_name: "Combined AMR Results",
        file_type_display: ".csv",
        description:
          "Primary metrics (e.g. coverage, depth) for all AMR genes in all selected samples, combined into a single file.",
        category: "reports",
        execution_type: "resque",
        workflows: ["amr"],
      },
    };
    (httpUtils.get as jest.Mock)
      .mockImplementationOnce(() => railsResponse)
      .mockImplementationOnce(() => railsResponse2);
    const result = await execute(query, {});
    const bulkDownloadResponse = [
      {
        id: "12714",
        status: "FAILED",
        startedAt: "2024-02-15T11:47:10.000-08:00",
        ownerUserId: 412,
        downloadType: "amr_combined_results_bulk_download",
        url: null,
        fileSize: null,
        entityInputFileType: "amr",
        entityInputs: [{ id: "1156", name: "norg_wtc" }],
        logUrl: null,
        errorMessage: null,
        params: {
          downloadFormat: null,
          metric: null,
          background: null,
          filterBy: null,
          taxaWithReads: null,
          includeMetadata: null,
          fileFormat: null,
        },
      },
    ];
    expect(result.data.fedBulkDownloads).toStrictEqual(bulkDownloadResponse);
  });

  it("should give correct response with url params & successful run", async () => {
    const query = getExampleQuery("bulk-downloads-with-limit");
    const railsResponse = [
      {
        id: 12715,
        params_json:
          '{"sample_ids":{"value":[24682,25015,25160]},"workflow":{"value":"short-read-mngs"},"background":{"value":350,"displayName":"floo sp86"}}',
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
      },
    ];
    const railsResponse2 = {
      bulk_download: {
        id: 12715,
        params_json:
          '{"sample_ids":{"value":[24682,25015,25160]},"workflow":{"value":"short-read-mngs"},"background":{"value":350,"displayName":"floo sp86"}}',
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
      download_type: {
        type: "sample_taxon_report",
        display_name: "Sample Taxon Reports",
        description:
          "Computed metrics (e.g. total reads, rPM) and metadata for each taxon identified in the sample",
        category: "reports",
        execution_type: "resque",
        file_type_display: ".csv",
        workflows: ["short-read-mngs"],
      },
    };
    (httpUtils.get as jest.Mock)
      .mockImplementationOnce(() => railsResponse)
      .mockImplementationOnce(() => railsResponse2);
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
        params: {
          downloadFormat: null,
          metric: null,
          background: null,
          filterBy: null,
          taxaWithReads: null,
          includeMetadata: null,
          fileFormat: null,
        },
      },
    ];
    expect(result.data.fedBulkDownloads).toStrictEqual(bulkDownloadResponse);
  });
});
