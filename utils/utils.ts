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
