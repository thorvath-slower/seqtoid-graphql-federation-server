export const getContext = ({
  mockHeaderValue = "mockHeaderValue",
  mockQuery = "mockQuery",
}: {
  mockHeaderValue?: string;
  mockQuery?: string;
} = {}) => {

  const mockedHeaders: unknown = {
    get: jest.fn().mockReturnValue(mockHeaderValue),
  };

  return {
    request: {
      headers: mockedHeaders as Headers,
    },
    params: {
      query: mockQuery,
    }
  };
};
