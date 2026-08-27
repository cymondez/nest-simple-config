// eslint-disable-next-line @typescript-eslint/ban-types
export function getBindOptionToken(optionType: Function): string {
  return `CONFIG_OPTION:${optionType.name}`;
}