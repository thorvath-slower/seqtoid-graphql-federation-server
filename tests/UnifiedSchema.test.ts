import { GraphQLSchema, lexicographicSortSchema } from 'graphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { getMeshInstance } from "./utils/MeshInstance";

describe('CZ ID graphQL federation generated schema', () => {
  it('should generate a valid schema', async () => {
    const { schema } = await getMeshInstance();

    // Sort the schema
    const sortedSchema = lexicographicSortSchema(schema as GraphQLSchema);

    expect(printSchemaWithDirectives(sortedSchema)).toMatchSnapshot();
  });
});