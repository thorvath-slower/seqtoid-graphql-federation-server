import { query_fedSequencingReads_items } from "../../.mesh";
import { TEN_MILLION } from "../../utils/constants";
import {
  fetchFromNextGen,
  get,
  getFromRails,
  shouldReadFromNextGen,
} from "../../utils/httpUtils";
import { formatUrlParams } from "../../utils/paramsUtils";
import { convertSequencingReadsQuery } from "../../utils/queryFormatUtils";
import { getMetadataEdges } from "../../utils/utils";

export const fedSequencingReadsResolver = async (root, args, context: any) => {
  const input = args.input;
  const queryingIdsOnly = /{\s*id\s*}/.test(context.params.query);
  if (input == null) {
    throw new Error("fedSequencingReads input is nullish");
  }

  // NEXT GEN:
  const nextGenEnabled = await shouldReadFromNextGen(context);
  if (nextGenEnabled) {
    // NEXT GEN IDS:
    if (queryingIdsOnly) {
      const nextGenPromise = fetchFromNextGen({
        customQuery: convertSequencingReadsQuery(context.params.query),
        customVariables: {
          where: {
            collectionId: input.where?.collectionId,
            taxon: input.where?.taxon,
            consensusGenomes: input.where?.consensusGenomes,
            // Entities Service doesn't support sample host + metadata yet.
            sample:
              input.where?.sample?.name != null
                ? {
                    name: input.where.sample.name,
                  }
                : undefined,
          },
          orderBy:
            input.orderByArray?.[0]?.protocol != null ||
            input.orderByArray?.[0]?.technology != null ||
            input.orderByArray?.[0]?.medakaModel != null ||
            input.orderByArray?.[0]?.sample?.name != null
              ? input.orderByArray
              : undefined,
        },
        serviceType: "entities",
        args,
        context,
      });

      const isSortingInRails =
        input.orderByArray?.[0]?.sample?.metadata != null ||
        input.orderByArray?.[0]?.sample?.hostOrganism?.name != null;
      if (
        !input.where?.sample?.collectionLocation?._in?.length &&
        !input.where?.sample?.hostOrganism?.name?._in?.length &&
        !input.where?.sample?.sampleType?._in?.length &&
        !isSortingInRails
      ) {
        // Don't need Rails.
        return (await nextGenPromise).data.sequencingReads;
      }

      const railsSampleIds: number[] = (
        await getFromRails({
          url:
            "/samples/index_v2.json" +
            formatUrlParams({
              locationV2: input?.where?.sample?.collectionLocation?._in,
              host: input?.where?.sample?.hostOrganism?.name?._in,
              tissue: input?.where?.sample?.sampleType?._in,
              orderBy: isSortingInRails
                ? input.orderByArray?.[0]?.sample?.metadata?.fieldName ?? "host"
                : undefined,
              orderDir: isSortingInRails
                ? (input.orderByArray?.[0]?.sample?.metadata?.dir ??
                    input.orderByArray?.[0]?.sample?.hostOrganism?.name) ===
                  "asc_nulls_first"
                  ? "ASC"
                  : "DESC"
                : undefined,
              limit: 0,
              offset: 0,
              listAllIds: true,
            }),
          args,
          context,
        })
      ).all_samples_ids;

      if (isSortingInRails) {
        const sampleIdsToReads = new Map<number, any>();
        for (const read of (await nextGenPromise).data.sequencingReads) {
          if (!sampleIdsToReads.has(read.sample.railsSampleId)) {
            sampleIdsToReads.set(read.sample.railsSampleId, [read]);
          } else {
            sampleIdsToReads.get(read.sample.railsSampleId)?.push(read);
          }
        }
        return railsSampleIds.flatMap(id => sampleIdsToReads.get(id) ?? []);
      } else {
        const railsSampleIdsSet = new Set(railsSampleIds);
        return (await nextGenPromise).data.sequencingReads.filter(
          sequencingRead =>
            railsSampleIdsSet.has(sequencingRead.sample.railsSampleId),
        );
      }
    }

    // NEXT GEN PAGE:
    const nextGenResponse = await fetchFromNextGen({
      customQuery: convertSequencingReadsQuery(context.params.query),
      customVariables: {
        where: input.where,
        producingRunIds:
          input.consensusGenomesInput?.where?.producingRunId?._in,
      },
      serviceType: "entities",
      args,
      context,
    });
    const nextGenSequencingReads = nextGenResponse?.data?.sequencingReads;
    if (nextGenSequencingReads == null) {
      throw new Error(
        `NextGen sequencingReads query failed: ${JSON.stringify(nextGenResponse)}`,
      );
    }
    const railsSampleIds = nextGenSequencingReads
      .map(sequencingRead => sequencingRead.sample.railsSampleId)
      .filter(id => id != null);
    if (railsSampleIds.length === 0) {
      return [];
    }

    const railsSamplesById = new Map<number, { [key: string]: any }>(
      (
        await getFromRails({
          url:
            "/samples/index_v2.json" +
            formatUrlParams({
              sampleIds: railsSampleIds,
              limit: TEN_MILLION,
              offset: 0,
              listAllIds: false,
            }),
          args,
          context,
        })
      ).samples.map(sample => [sample.id, sample]),
    );

    for (const nextGenSequencingRead of nextGenSequencingReads) {
      const nextGenSample = nextGenSequencingRead.sample;
      const railsSample = railsSamplesById.get(nextGenSample.railsSampleId);

      const railsMetadata:
        | { [key: string]: string | { name: string } }
        | null
        | undefined = railsSample?.details?.metadata;
      const railsDbSample = railsSample?.details?.db_sample;

      nextGenSequencingRead.nucleicAcid = railsMetadata?.nucleotide_type ?? "";
      nextGenSample.collectionLocation =
        typeof railsMetadata?.collection_location_v2 === "string"
          ? railsMetadata.collection_location_v2
          : railsMetadata?.collection_location_v2?.name ?? "";
      nextGenSample.sampleType = railsMetadata?.sample_type ?? "";
      nextGenSample.waterControl = railsMetadata?.water_control === "Yes";
      nextGenSample.notes = railsDbSample?.sample_notes;
      nextGenSample.uploadError = railsDbSample?.upload_error;
      nextGenSample.hostOrganism =
        railsDbSample?.host_genome_name != null
          ? {
              name: railsDbSample.host_genome_name,
            }
          : null;
      nextGenSample.ownerUserName = railsSample?.details?.uploader?.name;
      nextGenSample.collection = {
        name: railsSample?.details?.derived_sample_output?.project_name,
        public: railsSample?.public === 1,
      };
      nextGenSample.metadatas = {
        edges: getMetadataEdges(railsMetadata),
      };
    }

    return nextGenSequencingReads;
  }

  // RAILS:
  const { workflow_runs } = await get({
    url:
      "/workflow_runs.json" +
      formatUrlParams({
        mode: queryingIdsOnly ? "basic" : "with_sample_info",
        domain: input.todoRemove?.domain,
        projectId: input.todoRemove?.projectId,
        search: input.todoRemove?.search,
        orderBy: input.todoRemove?.orderBy,
        orderDir: input.todoRemove?.orderDir,
        host: input.todoRemove?.host,
        locationV2: input.todoRemove?.locationV2,
        taxon: input.todoRemove?.taxons,
        taxaLevels: input.todoRemove?.taxaLevels,
        time: input.todoRemove?.time,
        tissue: input.todoRemove?.tissue,
        visibility: input.todoRemove?.visibility,
        workflow: input.todoRemove?.workflow,
        limit: queryingIdsOnly
          ? TEN_MILLION
          : input.limit ?? input.limitOffset?.limit, // TODO: Just use limitOffset.
        offset: queryingIdsOnly ? 0 : input.offset ?? input.limitOffset?.offset,
        listAllIds: false,
        // workflowRunIds and sampleIds are only used for API testing.
        workflowRunIds: input?.todoRemove?.workflowRunIds,
        sampleIds: input?.todoRemove?.sampleIds,
      }),
    args,
    context,
  });
  if (queryingIdsOnly) {
    const uniqueSampleIds = new Set<string>(
      workflow_runs.map(run => run.sample.info.id.toString()),
    );
    return [...uniqueSampleIds].map(sampleId => ({
      id: sampleId,
    }));
  }
  if (!workflow_runs?.length) {
    return [];
  }

  const result: query_fedSequencingReads_items[] = [];

  for (const run of workflow_runs) {
    const inputs = run.inputs;
    const qualityMetrics = run.cached_results?.quality_metrics;
    const sample = run.sample;
    const sampleInfo = sample?.info;
    const sampleMetadata = sample?.metadata;

    const id = sampleInfo?.id?.toString() ?? "";
    const taxon =
      inputs?.taxon_name != null
        ? {
            name: inputs.taxon_name,
          }
        : null;
    const accession =
      inputs?.accession_id != null && inputs?.accession_name != null
        ? {
            accessionId: inputs?.accession_id,
            accessionName: inputs?.accession_name,
          }
        : null;
    const consensusGenomeEdge = {
      node: {
        producingRunId: run.id?.toString(),
        taxon,
        referenceGenome: accession,
        accession,
        metrics: {
          coverageDepth: run.cached_results?.coverage_viz?.coverage_depth,
          totalReads: qualityMetrics?.total_reads,
          gcPercent: qualityMetrics?.gc_percent,
          refSnps: qualityMetrics?.ref_snps,
          percentIdentity: qualityMetrics?.percent_identity,
          nActg: qualityMetrics?.n_actg,
          percentGenomeCalled: qualityMetrics?.percent_genome_called,
          nMissing: qualityMetrics?.n_missing,
          nAmbiguous: qualityMetrics?.n_ambiguous,
          referenceGenomeLength: qualityMetrics?.reference_genome_length,
        },
      },
    };

    const existingSequencingRead = result.find(
      sequencingRead => sequencingRead.id === id,
    );
    if (existingSequencingRead !== undefined) {
      existingSequencingRead.consensusGenomes.edges.push(consensusGenomeEdge);
    } else {
      result.push({
        id,
        nucleicAcid: sampleMetadata?.nucleotide_type ?? "",
        protocol: inputs?.wetlab_protocol,
        medakaModel: inputs?.medaka_model,
        technology: inputs?.technology ?? "",
        taxon,
        sample: {
          railsSampleId: sampleInfo?.id,
          name: sampleInfo?.name ?? "",
          notes: sampleInfo?.sample_notes,
          uploadError: sampleInfo?.result_status_description,
          collectionLocation:
            typeof sampleMetadata?.collection_location_v2 === "string"
              ? sampleMetadata.collection_location_v2
              : sampleMetadata?.collection_location_v2?.name ?? "",
          sampleType: sampleMetadata?.sample_type ?? "",
          waterControl: sampleMetadata?.water_control === "Yes",
          hostOrganism:
            sampleInfo?.host_genome_name != null
              ? {
                  name: sampleInfo.host_genome_name,
                }
              : null,
          collection: {
            name: sample?.project_name,
            public: Boolean(sampleInfo?.public),
          },
          ownerUserId: sample?.uploader?.id,
          // TODO: Make runner come from Workflows stitched with the user service when NextGen
          // ready.
          ownerUserName: run.runner?.name ?? sample?.uploader?.name,
          metadatas: {
            edges: getMetadataEdges(sampleMetadata),
          },
        },
        consensusGenomes: {
          edges: [consensusGenomeEdge],
        },
      });
    }
  }

  return result;
};
