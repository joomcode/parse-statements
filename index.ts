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
  SomeParsedTokens extends readonly ParsedToken[] | [string] = [string],
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
 * Pair of the comment open and close tokens (raw or parsed).
 */
type CommentPair<Token = ParsedToken> = readonly [open: Token, close: Token];

/**
 * Key of regexp (name of named capturing groups).
 */
type Key = string;

/**
 * Returns a copy of the object type with mutable properties.
 * `Mutable<{readonly foo: string}>` = `{foo: string}`.
 */
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Options of createParseFunction function.
 */
type Options<Context> = Readonly<{
  comments?: readonly Comment<Context>[];
  onError?: Callback<Context>;
  statements?: readonly Statement<Context>[];
}>;

/**
 * Parse function.
 */
type Parse<Context> = Callback<Context, []>;

/**
 * The result of parsing the token.
 */
type ParsedToken = Readonly<{start: number; end: number; token: string}>;

/**
 * The result of parsing the statement.
 */
type ParsedTokens = [...ParsedTokenWithComments[], ParsedToken];

/**
 * The result of parsing the statement with concrete length (number of tokens).
 */
type ParsedTokensByLength<Length extends keyof AllLength> = [...AllLength[Length], ParsedToken];

/**
 * The result of parsing a statement token with parsed comment tokens
 * in the code between this token and the next token of statement.
 */
type ParsedTokenWithComments = ParsedToken & {
  readonly comments?: readonly CommentPair[];
};

/**
 * Internal prepared description of comment.
 */
type PreparedComment<Context> = Readonly<{
  closeRegexp: RegExp;
  onError: Comment<Context>['onError'];
  onParse: Comment<Context>['onParse'];
}>;

/**
 * Internal prepared options of parse function.
 */
type PreparedOptions<Context> = Readonly<{
  commentsKeys: readonly Key[];
  nextStatementRegexp: RegExp;
  onError: Options<Context>['onError'];
  preparedComments: Readonly<Record<Key, PreparedComment<Context>>>;
  preparedStatements: Readonly<Record<Key, PreparedStatement<Context>>>;
  statementsKeys: readonly Key[];
}>;

/**
 * Internal prepared description of statement.
 */
type PreparedStatement<Context> = Readonly<{
  onError: Statement<Context>['onError'];
  onParse: Statement<Context>['onParse'];
  tokens: readonly PreparedToken[];
}>;

/**
 * Internal prepared description of token.
 */
type PreparedToken = Readonly<{
  nextTokenKey: Key;
  nextTokenRegexp: RegExp;
}>;

/**
 * Description of statement as the callback handlers and a sequence of tokens.
 */
type Statement<Context> = Readonly<{
  onError?: OnParse<Context>;
  onParse?: OnParse<Context>;
  tokens: readonly [string, ...string[]];
}>;

/**
 * Pair of the token and his regexp key.
 */
type TokenWithKey = readonly [key: Key, token: string];

/**
 * Create regexp by tokens.
 */
const createRegexp = (...tokens: readonly TokenWithKey[]): RegExp => {
  if (!tokens[0]) {
    return emptyRegexp;
  }

  let source = tokens[0][1];

  if (tokens[0][0] !== '') {
    source = tokens.map(([key, token]) => `(?<${key}>${token})`).join('|');
  }

  return new RegExp(source, 'gmu');
};

/**
 * Empty comments array to skip `for-or` cycle.
 */
const emptyComments: readonly CommentPair[] = [];

/**
 * Empty regexp that match only the empty string.
 */
const emptyRegexp = /^$/g;

/**
 * Get internal prepared options from public options.
 */
const getPreparedOptions = <Context>({
  comments = [],
  onError,
  statements = [],
}: Options<Context>): PreparedOptions<Context> => {
  const commentsKeys: Key[] = [];
  const firstTokens: TokenWithKey[] = [];
  let keyIndex = 1;
  const openTokens: TokenWithKey[] = [];
  const preparedComments: Record<Key, PreparedComment<Context>> = {};
  const preparedStatements: Record<Key, PreparedStatement<Context>> = {};
  const statementsKeys: Key[] = [];

  for (const {
    onError,
    onParse,
    tokens: [open, close],
  } of comments) {
    const closeRegexp = createRegexp(['', close]);
    const key: Key = `parseStatementsPackageComment${keyIndex++}`;

    commentsKeys.push(key);
    openTokens.push([key, open]);

    preparedComments[key] = {closeRegexp, onError, onParse};
  }

  for (const {
    onError,
    onParse,
    tokens: [firstToken, ...restTokens],
  } of statements) {
    const statementKey: Key = `parseStatementsPackageStatement${keyIndex++}`;
    const tokens: PreparedToken[] = [];

    firstTokens.push([statementKey, firstToken]);
    statementsKeys.push(statementKey);

    for (const nextToken of restTokens) {
      const nextTokenKey: Key = `parseStatementsPackageStatementPart${keyIndex++}`;
      const nextTokenRegexp = createRegexp([nextTokenKey, nextToken], ...openTokens);

      tokens.push({nextTokenKey, nextTokenRegexp});
    }

    preparedStatements[statementKey] = {onError, onParse, tokens};
  }

  const nextStatementRegexp = createRegexp(...firstTokens, ...openTokens);

  return {
    commentsKeys,
    nextStatementRegexp,
    onError,
    preparedComments,
    preparedStatements,
    statementsKeys,
  };
};

/**
 * Creates parse function by comments and statements.
 */
export const createParseFunction = <Context>(options: Options<Context>): Parse<Context> => {
  const {
    commentsKeys,
    nextStatementRegexp,
    onError: onGlobalError,
    preparedComments,
    preparedStatements,
    statementsKeys,
  } = getPreparedOptions(options);
  const parse: Parse<Context> = (context, source) => {
    let index = 0;
    let parsedComments: Record<number, CommentPair> | undefined;
    let previousIndex: number | undefined;

    findNextStatement: while (index < source.length) {
      if (index === previousIndex) {
        index += 1;

        continue findNextStatement;
      }

      previousIndex = index;

      nextStatementRegexp.lastIndex = index;
      const nextStatementMatch = nextStatementRegexp.exec(source);

      if (nextStatementMatch === null) {
        return;
      }

      for (const key of statementsKeys) {
        const token = nextStatementMatch.groups?.[key];

        if (token === undefined) {
          continue;
        }

        const parsedTokens: ParsedTokenWithComments[] = [];

        const {onError, onParse, tokens} = preparedStatements[key]!;

        index = nextStatementRegexp.lastIndex;
        let lastParsedToken: Mutable<ParsedTokenWithComments> = {
          start: nextStatementMatch.index,
          end: index,
          token,
        };
        parsedTokens.push(lastParsedToken);

        for (const {nextTokenRegexp, nextTokenKey} of tokens) {
          let previousTokensIndex: number | undefined;
          let tokensIndex = index;

          findNextToken: while (tokensIndex < source.length) {
            if (tokensIndex === previousTokensIndex) {
              tokensIndex += 1;

              continue findNextToken;
            }

            previousTokensIndex = tokensIndex;

            nextTokenRegexp.lastIndex = tokensIndex;
            const nextTokenMatch = nextTokenRegexp.exec(source);

            if (nextTokenMatch === null) {
              if (parsedComments === undefined) {
                parsedComments = {};

                for (const commentPair of lastParsedToken.comments || emptyComments) {
                  parsedComments[commentPair[0].start] = commentPair;
                }
              }

              delete lastParsedToken.comments;

              onError?.(context, source, ...(parsedTokens as ParsedTokens));

              continue findNextStatement;
            }

            const nextToken = nextTokenMatch.groups?.[nextTokenKey];

            if (nextToken !== undefined) {
              index = nextTokenRegexp.lastIndex;
              lastParsedToken = {start: nextTokenMatch.index, end: index, token: nextToken};
              parsedTokens.push(lastParsedToken);

              break findNextToken;
            }

            for (const commentKey of commentsKeys) {
              const commentToken = nextTokenMatch.groups?.[commentKey];

              if (commentToken === undefined) {
                continue;
              }

              if (parsedComments !== undefined) {
                const commentPair = parsedComments[nextTokenMatch.index];

                if (commentPair === undefined) {
                  onGlobalError?.(
                    context,
                    source,
                    `Cannot find already parsed comment in statement ${token} with token ${commentToken} at index ${nextTokenMatch.index}`,
                  );
                } else {
                  tokensIndex = commentPair[1].end;

                  let {comments} = lastParsedToken;

                  if (comments === undefined) {
                    comments = [];
                    lastParsedToken.comments = comments;
                  }

                  (comments as CommentPair[]).push(commentPair);

                  continue findNextToken;
                }
              }

              const {
                closeRegexp,
                onError: onCommentError,
                onParse: onCommentParse,
              } = preparedComments[commentKey]!;

              tokensIndex = nextTokenRegexp.lastIndex;
              const openToken = {
                start: nextTokenMatch.index,
                end: tokensIndex,
                token: commentToken,
              };

              closeRegexp.lastIndex = tokensIndex;
              const closeMatch = closeRegexp.exec(source);

              if (closeMatch === null) {
                onCommentError?.(context, source, openToken);
                onError?.(context, source, ...(parsedTokens as ParsedTokens));

                return;
              }

              tokensIndex = closeRegexp.lastIndex;
              const closeToken = {
                start: closeMatch.index,
                end: tokensIndex,
                token: closeMatch[0],
              };

              let {comments} = lastParsedToken;

              if (comments === undefined) {
                comments = [];
                lastParsedToken.comments = comments;
              }

              (comments as CommentPair[]).push([openToken, closeToken]);

              onCommentParse?.(context, source, openToken, closeToken);

              continue findNextToken;
            }

            onGlobalError?.(
              context,
              source,
              `Cannot find next part of statement ${token} or comments by regexp ${nextTokenRegexp} starting at index ${tokensIndex}`,
            );

            tokensIndex = nextTokenRegexp.lastIndex;
          }
        }

        onParse?.(context, source, ...(parsedTokens as ParsedTokens));

        continue findNextStatement;
      }

      for (const key of commentsKeys) {
        const token = nextStatementMatch.groups?.[key];

        if (token === undefined) {
          continue;
        }

        if (parsedComments !== undefined) {
          const commentPair = parsedComments[nextStatementMatch.index];

          if (commentPair === undefined) {
            onGlobalError?.(
              context,
              source,
              `Cannot find already parsed comment with token ${token} at index ${nextStatementMatch.index}`,
            );
          } else {
            index = commentPair[1].end;

            continue findNextStatement;
          }
        }

        const {closeRegexp, onError, onParse} = preparedComments[key]!;

        index = nextStatementRegexp.lastIndex;
        const openToken = {start: nextStatementMatch.index, end: index, token};

        closeRegexp.lastIndex = index;
        const closeMatch = closeRegexp.exec(source);

        if (closeMatch === null) {
          onError?.(context, source, openToken);

          return;
        }

        index = closeRegexp.lastIndex;
        const closeToken = {start: closeMatch.index, end: index, token: closeMatch[0]};

        onParse?.(context, source, openToken, closeToken);

        continue findNextStatement;
      }

      onGlobalError?.(
        context,
        source,
        `Cannot find statements or comments by regexp ${nextStatementRegexp} starting at index ${index}`,
      );

      index = nextStatementRegexp.lastIndex;
    }
  };

  return parse;
};

/**
 * onError handler for error on comment parsing.
 */
export type OnCommentError<Context> = Callback<Context, [open: ParsedToken]>;

/**
 * onParse handler of comment.
 */
export type OnCommentParse<Context> = Callback<Context, CommentPair>;

/**
 * onParse handler of statement with concrete length (number of tokens).
 */
export type OnParse<Context = any, Length extends keyof AllLength | 0 = 0> = Callback<
  Context,
  ParsedTokens,
  Length
>;
