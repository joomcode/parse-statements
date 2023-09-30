/**
 * Supported number of tokens in statements.
 */
type AllLength<P = ParsedTokenWithComments> = {
  1: [];
  2: [P];
  3: [P, P];
  4: [P, P, P];
  5: [P, P, P, P];
  6: [P, P, P, P, P];
  7: [P, P, P, P, P, P];
  8: [P, P, P, P, P, P, P];
  9: [P, P, P, P, P, P, P, P];
  10: [P, P, P, P, P, P, P, P, P];
  11: [P, P, P, P, P, P, P, P, P, P];
  12: [P, P, P, P, P, P, P, P, P, P, P];
  13: [P, P, P, P, P, P, P, P, P, P, P, P];
  14: [P, P, P, P, P, P, P, P, P, P, P, P, P];
  15: [P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  16: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  17: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  18: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  19: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  20: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  21: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  22: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  23: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  24: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  25: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  26: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  27: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  28: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  29: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  30: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  31: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
  32: [P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P, P];
};

/**
 * A callback handler called on successful parsing of a statement or on an error during parsing.
 */
type Callback<
  Context,
  SomeParsedTokens extends readonly ParsedToken[] | ErrorArguments = ErrorArguments,
  Length extends keyof AllLength | 0 = 0,
> = (
  this: void,
  context: Context,
  source: string,
  ...parsedTokens: SomeParsedTokens extends ParsedTokens
    ? Length extends 0
      ? SomeParsedTokens
      : ParsedTokensByLength<Length extends keyof AllLength ? Length : never>
    : SomeParsedTokens
) => void;

/**
 * Description of comment as the callback handlers and open and close tokens.
 */
type Comment<Context> = Readonly<{
  onError?: OnCommentError<Context>;
  onParse?: Callback<Context, CommentPair>;
  tokens: CommentPair<string>;
}>;

/**
 * Own arguments of global error callback (after context and source).
 */
type ErrorArguments = readonly [message: string, index: number];

/**
 * The result of parsing the statement with concrete length (number of tokens).
 */
type ParsedTokensByLength<Length extends keyof AllLength> = [...AllLength[Length], ParsedToken];

/**
 * Description of statement as the callback handlers and a sequence of tokens.
 */
type Statement<Context> = Readonly<{
  canIncludeComments: boolean;
  onError?: OnParse<Context>;
  onParse?: OnParse<Context>;
  tokens: readonly [string, ...string[]];
}>;

/**
 * Pair of the comment open and close tokens (raw or parsed).
 */
export type CommentPair<Token = ParsedToken> = readonly [open: Token, close: Token];

/**
 * Key of regexp (name of named capturing groups).
 */
export type Key = string;

/**
 * onError callback handler for error on comment parsing.
 */
export type OnCommentError<Context> = Callback<Context, [open: ParsedToken]>;

/**
 * onParse callback handler of comment.
 */
export type OnCommentParse<Context> = Callback<Context, CommentPair>;

/**
 * Global onError callback handler for error on parsing.
 */
export type OnGlobalError<Context> = Callback<Context>;

/**
 * onParse callback handler of statement with concrete length (number of tokens).
 */
export type OnParse<Context = any, Length extends keyof AllLength | 0 = 0> = Callback<
  Context,
  ParsedTokens,
  Length
>;

/**
 * Options of createParseFunction function.
 */
export type Options<Context> = Readonly<{
  comments?: readonly Comment<Context>[];
  onError?: OnGlobalError<Context>;
  statements?: readonly Statement<Context>[];
}>;

/**
 * Returns a copy of the object type with mutable properties.
 * `Mutable<{readonly foo: string}>` = `{foo: string}`.
 */
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Parse function.
 */
export type Parse<Context> = Callback<Context, []>;

/**
 * The result of parsing the token.
 */
export type ParsedToken = Readonly<{
  start: number;
  end: number;
  match: RegExpExecArray;
  token: string;
}>;

/**
 * The result of parsing the statement.
 */
export type ParsedTokens = [...ParsedTokenWithComments[], ParsedToken];

/**
 * The result of parsing a statement token with parsed comment tokens
 * in the code between this token and the next token of statement.
 */
export type ParsedTokenWithComments = ParsedToken & {
  readonly comments?: readonly CommentPair[];
};

/**
 * Internal prepared description of comment.
 */
export type PreparedComment<Context> = Readonly<{
  closeRegExp: RegExp;
  onError: Comment<Context>['onError'];
  onParse: Comment<Context>['onParse'];
}>;

/**
 * Internal prepared options of parse function.
 */
export type PreparedOptions<Context> = Readonly<{
  commentsKeys: readonly Key[];
  nextStatementRegExp: RegExp;
  onError: Options<Context>['onError'];
  preparedComments: Readonly<Record<Key, PreparedComment<Context>>>;
  preparedStatements: Readonly<Record<Key, PreparedStatement<Context>>>;
  statementsKeys: readonly Key[];
}>;

/**
 * Internal prepared description of statement.
 */
export type PreparedStatement<Context> = Readonly<{
  onError: Statement<Context>['onError'];
  onParse: Statement<Context>['onParse'];
  tokens: readonly PreparedToken[];
}>;

/**
 * Internal prepared description of token.
 */
export type PreparedToken = Readonly<{
  nextTokenKey: Key;
  nextTokenRegExp: RegExp;
}>;

/**
 * Pair of the token and his regexp key.
 */
export type TokenWithKey = readonly [key: Key, token: string];
