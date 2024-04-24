import { postWithCSRF } from "../../utils/httpUtils";

export const UpdateMetadataResolver = async (root, args, context, info) => {
  const body = {
    field: args?.input?.field,
    value: args?.input?.value.String
      ? args.input.value.String
      : args?.input?.value
          .query_SampleMetadata_metadata_items_location_validated_value_oneOf_1_Input,
  };
  const res = await postWithCSRF({
    url: `/samples/${args.sampleId}/save_metadata_v2`,
    body,
    args,
    context,
  });
  return res;
};
