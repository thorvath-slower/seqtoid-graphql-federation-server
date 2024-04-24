import { get } from "../../utils/httpUtils";

export const SampleMetadataResolver = async (root, args, context, info) => {
  const url = `/samples/${args.sampleId}/metadata`;
  const urlWithParams = args?.input?.pipelineVersion
    ? url + `?pipeline_version=${args?.input?.pipelineVersion}`
    : url;
  const res = await get({ url: urlWithParams, args, context });
  try {
    const metadata = res.metadata.map(item => {
      item.id = item.id.toString();
      return item;
    });
    if (res?.additional_info?.pipeline_run?.id) {
      res.additional_info.pipeline_run.id =
        res.additional_info.pipeline_run.id.toString();
    }
    // location_validated_value is a union type, so we need to add __typename to the object
    metadata.map(field => {
      if (typeof field.location_validated_value === "object") {
        field.location_validated_value = {
          __typename:
            "query_SampleMetadata_metadata_items_location_validated_value_oneOf_1",
          ...field.location_validated_value,
          id: field.location_validated_value.id.toString(),
        };
      } else if (typeof field.location_validated_value === "string") {
        field.location_validated_value = {
          __typename:
            "query_SampleMetadata_metadata_items_location_validated_value_oneOf_0",
          name: field.location_validated_value,
        };
      } else {
        field.location_validated_value = null;
      }
    });
    res.metadata = metadata;
    return res;
  } catch {
    return res;
  }
};
