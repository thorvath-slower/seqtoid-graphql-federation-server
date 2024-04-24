import { postWithCSRF } from "../../utils/httpUtils";

export const UpdateSampleNotesResolver = async (root, args, context, info) => {
  const body = {
    field: "sample_notes",
    value: args?.input?.value,
  };
  const res = await postWithCSRF({
    url: `/samples/${args.sampleId}/save_metadata`,
    body,
    args,
    context,
  });
  return res;
};
