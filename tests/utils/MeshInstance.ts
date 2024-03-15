import { getMesh, MeshInstance } from "@graphql-mesh/runtime";
import { join } from "path";
import { findAndParseConfig } from "@graphql-mesh/cli";

export const getMeshInstance = async (): Promise<MeshInstance> => {
  return findAndParseConfig({
    dir: join(__dirname, "../../"),
  }).then(config => getMesh(config));
};

export type MeshExecuteTestFunction = (
  query: string,
  input: any,
) => Promise<any>;

export const getMeshExecute = async (): Promise<MeshExecuteTestFunction> => {
  const mesh = await getMeshInstance();
  return (query, input) => mesh.execute(query, input, { params: { query } });
};
