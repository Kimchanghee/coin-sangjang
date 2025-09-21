declare module 'bcryptjs' {
  export function hash(
    data: string,
    saltOrRounds: string | number,
  ): Promise<string>;
  export function hash(
    data: string,
    saltOrRounds: string | number,
    callback: (err: Error | null, hashed: string) => void,
  ): void;

  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function compare(
    data: string,
    encrypted: string,
    callback: (err: Error | null, same: boolean) => void,
  ): void;
}
