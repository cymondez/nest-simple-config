export const BIND_OPTION_METADATA = Symbol('BIND_OPTION_METADATA');

export function BindOption(section: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(BIND_OPTION_METADATA, section, target);
  };
}