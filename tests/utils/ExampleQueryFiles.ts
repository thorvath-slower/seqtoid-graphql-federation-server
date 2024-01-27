import { readFileSync } from 'fs';
import { join } from "path";

const exampleQueriesDir = "../../example-queries";

const getZipLinkExampleQueryPath = () : string => {
  return join(__dirname, `${exampleQueriesDir}/zip-link-query.graphql`);
};

export const getZipLinkExampleQuery = () : string => {
  return readFileSync(getZipLinkExampleQueryPath(), { encoding: "utf8" });
}
