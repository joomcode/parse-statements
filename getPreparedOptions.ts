import type {
  Key,
  Options,
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
 * Empty regexp that match only the empty string.
 */
const emptyRegExp = /^$/g;

/**
 * Empty tokens array to skip comments into statements with `canIncludeComments` option.
 */
const emptyTokens: readonly TokenWithKey[] = [];

/**
 * Get internal prepared options from public options.
 */
export const getPreparedOptions = <Context>({
  comments = [],
  onError,
  statements = [],
}: Options<Context>): PreparedOptions<Context> => {
  const commentsKeys: Key[] = [];
  const firstTokens: TokenWithKey[] = [];
  let keyIndex = 1;
  const openTokens: TokenWithKey[] = [];
  const preparedComments = {__proto__: null} as unknown as Record<Key, PreparedComment<Context>>;
  const preparedStatements = {__proto__: null} as unknown as Record<
    Key,
    PreparedStatement<Context>
  >;
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
    canIncludeComments,
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
      const nextTokenRegExp = createRegExp(
        [nextTokenKey, nextToken],
        ...(canIncludeComments ? openTokens : emptyTokens),
      );

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
