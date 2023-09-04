import type {
  CommentPair,
  Key,
  Mutable,
  Options,
  Parse,
  ParsedTokens,
  ParsedTokenWithComments,
  PreparedComment,
  PreparedOptions,
  PreparedStatement,
  PreparedToken,
  TokenWithKey,
} from './types';

/**
 * Creates regexp by tokens.
 */
const createRegExp = (...tokens: readonly TokenWithKey[]): RegExp => {
  if (!tokens[0]) {
    return emptyRegExp;
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
const emptyRegExp = /^$/g;

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
    const closeRegExp = createRegExp(['', close]);
    const key: Key = `parseStatementsPackageComment${keyIndex++}`;

    commentsKeys.push(key);
    openTokens.push([key, open]);

    preparedComments[key] = {closeRegExp, onError, onParse};
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
      const nextTokenRegExp = createRegExp([nextTokenKey, nextToken], ...openTokens);

      tokens.push({nextTokenKey, nextTokenRegExp});
    }

    preparedStatements[statementKey] = {onError, onParse, tokens};
  }

  const nextStatementRegExp = createRegExp(...firstTokens, ...openTokens);

  return {
    commentsKeys,
    nextStatementRegExp,
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
    nextStatementRegExp,
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

      nextStatementRegExp.lastIndex = index;
      const nextStatementMatch = nextStatementRegExp.exec(source);

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

        index = nextStatementRegExp.lastIndex;
        let lastParsedToken: Mutable<ParsedTokenWithComments> = {
          start: nextStatementMatch.index,
          end: index,
          match: nextStatementMatch,
          token,
        };
        parsedTokens.push(lastParsedToken);

        for (const {nextTokenRegExp, nextTokenKey} of tokens) {
          let previousTokensIndex: number | undefined;
          let tokensIndex = index;

          findNextToken: while (tokensIndex < source.length) {
            if (tokensIndex === previousTokensIndex) {
              tokensIndex += 1;

              continue findNextToken;
            }

            previousTokensIndex = tokensIndex;

            nextTokenRegExp.lastIndex = tokensIndex;
            const nextTokenMatch = nextTokenRegExp.exec(source);

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
              index = nextTokenRegExp.lastIndex;
              lastParsedToken = {
                start: nextTokenMatch.index,
                end: index,
                match: nextTokenMatch,
                token: nextToken,
              };
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
                    `Cannot find already parsed comment in statement ${token} with token ${commentToken}`,
                    nextTokenMatch.index,
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
                closeRegExp,
                onError: onCommentError,
                onParse: onCommentParse,
              } = preparedComments[commentKey]!;

              tokensIndex = nextTokenRegExp.lastIndex;
              const openToken = {
                start: nextTokenMatch.index,
                end: tokensIndex,
                match: nextTokenMatch,
                token: commentToken,
              };

              closeRegExp.lastIndex = tokensIndex;
              const closeMatch = closeRegExp.exec(source);

              if (closeMatch === null) {
                onCommentError?.(context, source, openToken);
                onError?.(context, source, ...(parsedTokens as ParsedTokens));

                return;
              }

              tokensIndex = closeRegExp.lastIndex;
              const closeToken = {
                start: closeMatch.index,
                end: tokensIndex,
                match: closeMatch,
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
              `Cannot find next part of statement ${token} or comments by regexp ${nextTokenRegExp}`,
              tokensIndex,
            );

            tokensIndex = nextTokenRegExp.lastIndex;
          }

          if (tokensIndex >= source.length) {
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
              `Cannot find already parsed comment with token ${token}`,
              nextStatementMatch.index,
            );
          } else {
            index = commentPair[1].end;

            continue findNextStatement;
          }
        }

        const {closeRegExp, onError, onParse} = preparedComments[key]!;

        index = nextStatementRegExp.lastIndex;
        const openToken = {
          start: nextStatementMatch.index,
          end: index,
          match: nextStatementMatch,
          token,
        };

        closeRegExp.lastIndex = index;
        const closeMatch = closeRegExp.exec(source);

        if (closeMatch === null) {
          onError?.(context, source, openToken);

          return;
        }

        index = closeRegExp.lastIndex;
        const closeToken = {
          start: closeMatch.index,
          end: index,
          match: closeMatch,
          token: closeMatch[0],
        };

        onParse?.(context, source, openToken, closeToken);

        continue findNextStatement;
      }

      onGlobalError?.(
        context,
        source,
        `Cannot find statements or comments by regexp ${nextStatementRegExp}`,
        index,
      );

      index = nextStatementRegExp.lastIndex;
    }
  };

  return parse;
};

export type {
  CommentPair,
  OnCommentError,
  OnCommentParse,
  OnGlobalError,
  OnParse,
  ParsedToken,
} from './types';
