export function snakeToCamel(str: string) {
  return str.replace(/(?!^)_(.)/g, (_, char) => char.toUpperCase());
}
