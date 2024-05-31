/**
 * Converts an object into a query param string.
 *
 * Array values are spread out into separate params with "[]" appended to the key, e.g.
 *  { items: [1, 2] } would become "items[]=1&items[]=2".
 */

export const formatUrlParams = (params: { [s: string]: unknown }) => {
  const replaceSpaces = (value: string) => {
    const safeString = value.split(" ").join("+");
    return safeString;
  };
  const paramList = Object.entries(params)
    .filter(([_, value]) => value != null)
    .flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map(
            arrayElement =>
              `${key}[]=${typeof arrayElement === "object" ? JSON.stringify(arrayElement) : arrayElement}`,
          )
        : typeof value === "string"
          ? [`${key}=${replaceSpaces(value)}`]
          : typeof value === "object"
            ? [`${key}=${JSON.stringify(value)}`]
            : [`${key}=${value}`],
    );
  if (paramList.length === 0) {
    return "";
  }
  return "?&" + paramList.join("&");
};
