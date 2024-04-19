import { ExecuteMeshFn } from "@graphql-mesh/runtime";
import { getMeshInstance } from "./utils/MeshInstance";
import * as httpUtils from "../utils/httpUtils";
import { getExampleQuery } from "./utils/ExampleQueryFiles";

jest.spyOn(httpUtils, "get");
jest.spyOn(httpUtils, "getFromRails");
jest.spyOn(httpUtils, "shouldReadFromNextGen");

beforeEach(() => {
  (httpUtils.get as jest.Mock).mockClear();
  (httpUtils.getFromRails as jest.Mock).mockClear();
  (httpUtils.shouldReadFromNextGen as jest.Mock).mockClear();
});

describe("SampleForReport query:", () => {
  let execute: ExecuteMeshFn;
  const query = getExampleQuery("sample-for-report-query");

  beforeEach(async () => {
    const mesh$ = await getMeshInstance();
    ({ execute } = mesh$);
  });

  (httpUtils.getFromRails as jest.Mock).mockImplementation(() => ({
    // This is the first response from the rails server
    name: "sample_sars-cov-2_paired_2",
    created_at: "2024-02-29T15:09:07.000-08:00",
    updated_at: "2024-02-29T15:09:11.000-08:00",
    project_id: 1247,
    status: "checked",
    host_genome_id: 1,
    user_id: 345,
    upload_error: null,
    initial_workflow: "consensus-genome",
    project: { id: 1247, name: "ryan-new-project" },
    default_background_id: 93,
    default_pipeline_run_id: null,
    editable: true,
    pipeline_runs: [],
    workflow_runs: [
      {
        id: 7126,
        status: "SUCCEEDED",
        workflow: "consensus-genome",
        wdl_version: "3.5.0",
        executed_at: "2024-02-29T15:09:11.000-08:00",
        deprecated: false,
        input_error: {
          label: "Error label",
          message: "Error message",
        },
        inputs: {
          accession_id: "MN908947.3",
          accession_name:
            "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
          taxon_id: 2697049,
          taxon_name: "Severe acute respiratory syndrome coronavirus 2",
          technology: "Illumina",
          wetlab_protocol: "artic_v4",
          creation_source: "SARS-CoV-2 Upload",
        },
        parsed_cached_results: {
          coverage_viz: {
            coverage_breadth: 0.9983279269638498,
            coverage_depth: 223.1055746915025,
            max_aligned_length: 29903,
            total_length: 29903,
          },
          quality_metrics: {
            ercc_mapped_reads: 0,
            mapped_reads: 47053,
            n_actg: 29812,
            n_ambiguous: 0,
            n_missing: 41,
            ref_snps: 7,
            total_reads: 47108,
            percent_identity: 100,
            gc_percent: 38,
            percent_genome_called: 99.7,
            reference_genome_length: 29903,
          },
          taxon_info: {
            accession_id: "MN908947.3",
            accession_name:
              "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
            taxon_id: 2697049,
            taxon_name: "Severe acute respiratory syndrome coronavirus 2",
          },
        },
        run_finalized: true,
      },
    ],
  }));

  it("Responds with data from rails", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
      () => false,
    );
    const result = await execute(query, {
      railsSampleId: "35611",
      snapshotLinkId: "",
    });
    expect(result.data.SampleForReport).toEqual(
      expect.objectContaining({
        id: "35611",
        created_at: "2024-02-29T15:09:07.000-08:00",
        default_background_id: 93,
        default_pipeline_run_id: null,
        editable: true,
        host_genome_id: 1,
        initial_workflow: "consensus-genome",
        name: "sample_sars-cov-2_paired_2",
        pipeline_runs: [],
        project: {
          id: "1247",
          name: "ryan-new-project",
        },
        project_id: 1247,
        railsSampleId: "35611",
        status: "checked",
        updated_at: "2024-02-29T15:09:11.000-08:00",
        upload_error: null,
        user_id: 345,
        workflow_runs: [
          {
            deprecated: false,
            executed_at: "2024-02-29T15:09:11.000-08:00",
            id: "7126",
            input_error: {
              label: "Error label",
              message: "Error message",
            },
            inputs: {
              accession_id: "MN908947.3",
              accession_name:
                "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
              creation_source: "SARS-CoV-2 Upload",
              ref_fasta: null,
              taxon_id: "2697049",
              taxon_name: "Severe acute respiratory syndrome coronavirus 2",
              technology: "Illumina",
            },
            run_finalized: true,
            status: "SUCCEEDED",
            wdl_version: "3.5.0",
            workflow: "consensus-genome",
          },
        ],
      }),
    );
  });

  it("Responds with data from NextGen", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
      () => true,
    );
    // entitiesQuery response
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        samples: [
          {
            id: "018df720-f584-79df-b1b2-8cd87dba3a18",
            sequencingReads: {
              edges: [
                {
                  node: {
                    consensusGenomes: {
                      edges: [
                        {
                          node: {
                            id: "018df726-e9c5-7fd7-be8f-ca1d140ec6ac",
                            createdAt: "2024-02-29T23:15:39.005266+00:00",
                            producingRunId:
                              "018df720-fbd6-77f9-9b4a-1ca468d5207f",
                            referenceGenome: null,
                            sequencingRead: { technology: "Illumina" },
                          },
                        },
                      ],
                    },
                    sample: {
                      hostOrganism: {
                        id: "018df6c3-150d-76f6-bb43-e957145253d3",
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    }));
    // workflowRunQuery response
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        workflowRuns: [
          {
            id: "018df720-fbd6-77f9-9b4a-1ca468d5207f",
            _id: "V29ya2Zsb3dSdW46MDE4ZGY3MjAtZmJkNi03N2Y5LTliNGEtMWNhNDY4ZDUyMDdm",
            railsWorkflowRunId: 7126,
            status: "SUCCEEDED",
            ownerUserId: 345,
            errorLabel: "Error label",
            errorMessage: "Error message",
            workflowVersion: {
              version: "3.5.0",
              id: "018df6ca-d3c0-7edd-a243-4127e06eb1d1",
              workflow: { name: "consensus-genome" },
            },
            entityInputs: {
              edges: [
                {
                  node: {
                    inputEntityId: "018ded47-34ac-7f3a-9dff-a43e5036393a",
                    entityType: "taxon",
                  },
                },
                {
                  node: {
                    inputEntityId: "def",
                    entityType: "accession",
                  },
                },
              ],
            },
            createdAt: "2024-02-29T23:09:10.470257+00:00",
            endedAt: null,
            rawInputsJson:
              '{"ncbi_index_version": "2021-01-22", "sars_cov_2": true, "creation_source": "SARS-CoV-2 Upload"}',
          },
        ],
      },
    }));

    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        taxa: [
          {
            id: "018ded47-34ac-7f3a-9dff-a43e5036393a",
            name: "Severe acute respiratory syndrome coronavirus 2",
            upstreamDatabaseIdentifier: "2697049",
          },
        ],
      },
    }));
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        accessions: [
          {
            id: "def",
            accessionId: "MN908947.3",
            accessionName:
              "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
          },
        ],
      },
    }));

    const result = await execute(query, {
      railsSampleId: "35611",
      snapshotLinkId: "",
    });

    expect(result.data.SampleForReport).toEqual(
      expect.objectContaining({
        id: "35611",
        created_at: "2024-02-29T15:09:07.000-08:00",
        default_background_id: 93,
        default_pipeline_run_id: null,
        editable: true,
        host_genome_id: 1,
        initial_workflow: "consensus-genome",
        name: "sample_sars-cov-2_paired_2",
        pipeline_runs: [],
        project: {
          id: "1247",
          name: "ryan-new-project",
        },
        project_id: 1247,
        railsSampleId: "35611",
        status: "checked",
        updated_at: "2024-02-29T15:09:11.000-08:00",
        upload_error: null,
        user_id: 345,
        workflow_runs: [
          {
            deprecated: null,
            executed_at: "2024-02-29T23:09:10.470257+00:00",
            id: "018df720-fbd6-77f9-9b4a-1ca468d5207f",
            input_error: {
              label: "Error label",
              message: "Error message",
            },
            inputs: {
              accession_id: "MN908947.3",
              accession_name:
                "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
              creation_source: "SARS-CoV-2 Upload",
              ref_fasta: null,
              taxon_id: "2697049",
              taxon_name: "Severe acute respiratory syndrome coronavirus 2",
              technology: "Illumina",
            },
            run_finalized: true,
            status: "SUCCEEDED",
            wdl_version: "3.5.0",
            workflow: "consensus-genome",
          },
        ],
      }),
    );
  });

  it("Responds with data from NextGen -- unfinished workflow run", async () => {
    (httpUtils.shouldReadFromNextGen as jest.Mock).mockImplementation(
      () => true,
    );
    // entitiesQuery response
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        samples: [
          {
            id: "018df720-f584-79df-b1b2-8cd87dba3a18",
            sequencingReads: {
              edges: [
                {
                  node: {
                    consensusGenomes: {
                      edges: [],
                    },
                    sample: {
                      hostOrganism: {
                        id: "018df6c3-150d-76f6-bb43-e957145253d3",
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    }));
    // workflowRunQuery response
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        workflowRuns: [
          {
            id: "018df720-fbd6-77f9-9b4a-1ca468d5207f",
            _id: "V29ya2Zsb3dSdW46MDE4ZGY3MjAtZmJkNi03N2Y5LTliNGEtMWNhNDY4ZDUyMDdm",
            railsWorkflowRunId: 7126,
            status: "RUNNING",
            ownerUserId: 345,
            errorMessage: null,
            workflowVersion: {
              version: "3.5.0",
              id: "018df6ca-d3c0-7edd-a243-4127e06eb1d1",
              workflow: { name: "consensus-genome" },
            },
            entityInputs: {
              edges: [
                {
                  node: {
                    inputEntityId: "018ded47-34ac-7f3a-9dff-a43e5036393a",
                    entityType: "taxon",
                  },
                },
                {
                  node: {
                    inputEntityId: "def",
                    entityType: "accession",
                  },
                },
              ],
            },
            createdAt: "2024-02-29T23:09:10.470257+00:00",
            endedAt: null,
            rawInputsJson:
              '{"ncbi_index_version": "2021-01-22", "sars_cov_2": true, "creation_source": "SARS-CoV-2 Upload"}',
          },
        ],
      },
    }));

    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        taxa: [
          {
            id: "018ded47-34ac-7f3a-9dff-a43e5036393a",
            name: "Severe acute respiratory syndrome coronavirus 2",
            upstreamDatabaseIdentifier: "2697049",
          },
        ],
      },
    }));
    (httpUtils.get as jest.Mock).mockImplementationOnce(() => ({
      data: {
        accessions: [
          {
            id: "def",
            accessionId: "MN908947.3",
            accessionName:
              "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
          },
        ],
      },
    }));

    const result = await execute(query, {
      railsSampleId: "35611",
      snapshotLinkId: "",
    });

    expect(result.data.SampleForReport).toEqual(
      expect.objectContaining({
        id: "35611",
        created_at: "2024-02-29T15:09:07.000-08:00",
        default_background_id: 93,
        default_pipeline_run_id: null,
        editable: true,
        host_genome_id: 1,
        initial_workflow: "consensus-genome",
        name: "sample_sars-cov-2_paired_2",
        pipeline_runs: [],
        project: {
          id: "1247",
          name: "ryan-new-project",
        },
        project_id: 1247,
        railsSampleId: "35611",
        status: "checked",
        updated_at: "2024-02-29T15:09:11.000-08:00",
        upload_error: null,
        user_id: 345,
        workflow_runs: [
          {
            deprecated: null,
            executed_at: "2024-02-29T23:09:10.470257+00:00",
            id: "018df720-fbd6-77f9-9b4a-1ca468d5207f",
            input_error: null,
            inputs: {
              accession_id: "MN908947.3",
              accession_name:
                "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
              creation_source: "SARS-CoV-2 Upload",
              ref_fasta: null,
              taxon_id: "2697049",
              taxon_name: "Severe acute respiratory syndrome coronavirus 2",
              technology: null,
            },
            run_finalized: false,
            status: "RUNNING",
            wdl_version: "3.5.0",
            workflow: "consensus-genome",
          },
        ],
      }),
    );
  });

  // Tests to add:
  // test with snampshotLinkId
  // test for deduplication edge cases
});
