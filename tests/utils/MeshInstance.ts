import { getMesh, MeshInstance } from '@graphql-mesh/runtime';
import { join } from 'path';
import { findAndParseConfig } from "@graphql-mesh/cli";

export const getMeshInstance = async () : Promise<MeshInstance> => {
  return findAndParseConfig({
    dir: join(__dirname, "../../"),
  }).then(config => getMesh(config));
};
