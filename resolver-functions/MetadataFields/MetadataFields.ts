import { postWithCSRF } from "../../utils/httpUtils";

export const MetadataFieldsResolver = async (root, args, context, info) => {
  const body = {
    sampleIds: args?.input?.sampleIds,
  };
  const res = await postWithCSRF({
    url: `/samples/metadata_fields`,
    body,
    args,
    context,
  });
  return res;
};
