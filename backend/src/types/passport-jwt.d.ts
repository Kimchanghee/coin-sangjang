declare module 'passport-jwt' {
  import type { Request } from 'express';

  export interface StrategyOptions {
    jwtFromRequest: (req: Request) => string | null;
    secretOrKey: string;
    ignoreExpiration?: boolean;
    passReqToCallback?: false;
  }

  export interface StrategyOptionsWithRequest {
    jwtFromRequest: (req: Request) => string | null;
    secretOrKey: string;
    ignoreExpiration?: boolean;
    passReqToCallback: true;
  }

  export type VerifiedCallback = (
    err: Error | null,
    user?: unknown,
    info?: unknown,
  ) => void;

  export class Strategy {
    constructor(
      options: StrategyOptions,
      verify?: (payload: unknown, done: VerifiedCallback) => void,
    );
    constructor(
      options: StrategyOptionsWithRequest,
      verify?: (req: Request, payload: unknown, done: VerifiedCallback) => void,
    );
  }

  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): (req: Request) => string | null;
  };
}
