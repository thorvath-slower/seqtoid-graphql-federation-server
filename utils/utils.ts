export function snakeToCamel(str: string) {
  return str.replace(/(?!^)_(.)/g, (_, char) => char.toUpperCase());
}

export const toKebabCase = (str: unknown) => {
  if (typeof str !== "string") {
    return null;
  }
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map(x => x.toLowerCase())
    .join("-");
};

export const convertArrayToObject = (array: object[], key: string) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item,
    };
  }, initialValue);
};

export const getMetadataEdges = (
  sampleMetadata: any,
): Array<{ node: { fieldName: string; value: string } }> => {
  return sampleMetadata != null
    ? Object.entries(sampleMetadata)
        .filter(
          ([fieldName]) =>
            fieldName !== "nucleotide_type" &&
            fieldName !== "collection_location_v2" &&
            fieldName !== "sample_type" &&
            fieldName !== "water_control",
        )
        .map(([fieldName, value]) => ({
          node: {
            fieldName,
            value: String(value),
          },
        }))
    : [];
};
