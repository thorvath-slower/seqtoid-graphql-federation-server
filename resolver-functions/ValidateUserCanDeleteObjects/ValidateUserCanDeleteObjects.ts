import { postWithCSRF } from "../../utils/httpUtils";

export const ValidateUserCanDeleteObjectsResolver = async (
  root,
  args,
  context,
  info,
) => {
  if (!args?.input) {
    throw new Error("No input provided");
  }
  const { selectedIdsStrings, workflow, selectedIds } = args?.input;
  const body = {
    selectedIds: selectedIdsStrings ?? selectedIds,
    workflow: workflow,
  };
  const res = await postWithCSRF({
    url: `/samples/validate_user_can_delete_objects.json`,
    body,
    args,
    context,
  });
  return {
    validIds: res.validIds,
    validIdsStrings: res.validIds.map((id: number) => id.toString()),
    ...res,
  };
};
