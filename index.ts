import {getPreparedOptions} from './getPreparedOptions';

import type {
  CommentPair,
  Mutable,
  Options,
  Parse,
  ParsedTokens,
  ParsedTokenWithComments,
} from './types';

/**
 * Empty comments array to skip `for-or` cycle.
 */
const emptyComments: readonly CommentPair[] = [];

/**
 * Creates parse function by comments and statements.
 */
export const createParseFunction = <Context>(options: Options<Context>): Parse<Context> => {
  var {
    commentsKeys,
    nextStatementRegExp,
    onError: onGlobalError,
    preparedComments,
    preparedStatements,
    statementsKeys,
  } = getPreparedOptions(options);
  const parse: Parse<Context> = (context, source) => {
    var index = 0;
    var parsedComments: Record<number, CommentPair> | undefined;
    var previousIndex: number | undefined;

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

              const maybeIndex = onError?.(context, source, ...(parsedTokens as ParsedTokens));

              if (maybeIndex !== undefined) {
                index = maybeIndex;
              }

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

                  if (lastParsedToken.comments === undefined) {
                    lastParsedToken.comments = [];
                  }

                  (lastParsedToken.comments as CommentPair[]).push(commentPair);

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

              if (lastParsedToken.comments === undefined) {
                lastParsedToken.comments = [];
              }

              (lastParsedToken.comments as CommentPair[]).push([openToken, closeToken]);

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

            const maybeIndex = onError?.(context, source, ...(parsedTokens as ParsedTokens));

            if (maybeIndex !== undefined) {
              index = maybeIndex;
            }

            continue findNextStatement;
          }
        }

        const maybeIndex = onParse?.(context, source, ...(parsedTokens as ParsedTokens));

        if (maybeIndex !== undefined) {
          index = maybeIndex;
        }

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
  Options,
  Parse,
  ParsedToken,
} from './types';
