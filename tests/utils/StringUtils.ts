/** Compares 2 strings while ignoring differing length whitespace/tab/newline sequences. */
export function assertEqualsNoWhitespace(str1: string, str2: string): void {
  expect(str1.replace(/\s+/g, " ").trim()).toBe(
    str2.replace(/\s+/g, " ").trim(),
  );
}
