import { readFileSync } from "fs";
import { join } from "path";

/**
 * @param graphqlFile file name (excludes .graphql file extension)
 * @returns example query as a string
 */
export function getExampleQuery(graphqlFile: string): string {
  return readFileSync(
    join(__dirname, `../../example-queries/${graphqlFile}.graphql`),
    {
      encoding: "utf8",
    }
  );
}

/**
 * @param responseFile file name (excludes .json file extension)
 * @returns JSON.parse()d value from the response file
 */
export function getSampleResponse(responseFile: string): any {
  return JSON.parse(
    readFileSync(
      join(__dirname, `../../sample-responses/${responseFile}.json`),
      {
        encoding: "utf8",
      }
    )
  );
}
