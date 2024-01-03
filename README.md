# parse-statements ✂️

[![NPM version][npm-image]][npm-url]
[![dependencies: none][dependencies-none-image]][dependencies-none-url]
[![minzipped size][size-image]][size-url]
[![code style: prettier][prettier-image]][prettier-url]
[![Conventional Commits][conventional-commits-image]][conventional-commits-url]
[![License MIT][license-image]][license-url]

Fast and easy parser of statements in source code in any language.

`parse-statements` ✂️ allows you to parse statements consisting of a sequence of tokens
with arbitrary text between them. Statements cannot overlap.

In addition to statements, language comments can be described, which can also be located
inside statements (between its neighboring tokens).

Strings are used to describe (find) tokens, from which regexps with `gmu` flags are generated
(therefore, the backslash in these lines must be escaped, that is, it must be doubled).

For each parsed statement, the optional `onParse` callback is called with the context,
source code (string), and an array of tokens of statement
(and an array of comments between this token and the next one, if any).

If the sequence of tokens of statement has not completed, instead of the `onParse` callback,
an `onError` callback with the same signature is called, receiving an incomplete sequence
of parsed tokens of statement.

Similar optional callbacks can be set for comments.

Callbacks for statements (only for statements, not for comments) can return a number
instead of an `undefined` — then this number will be used as an index at the source code,
starting from which the parser will find the next statement.

In fact, this index will be interpreted as the end of the statement. By default,
the end of the statement coincides with the end of its last token,
but sometimes we may need to go beyond the boundaries of the found tokens
(or, conversely, reduce the length of the statement, that is, reduce its end index).

With such manual parsing, if we increase the index of the end of the statement,
we must remember to manually parse the comments that may appear
in this part of the statement — because the parser itself will not do this.
It will continue to work from the new end of the statement as usual.

## Basic example

Below is a simplified example of parsing `import` and `export` statements in ECMAScript
(a complete example can be found [here](https://github.com/joomcode/parse-imports-exports/blob/main/index.ts)):

```ts
import {createParseFunction} from 'parse-statements';

import type {OnCommentError, OnCommentParse, OnParse} from 'parse-statements';

const throwError = (message: string): void => {
  throw new Error(message);
};

type Context = Readonly<{
  errors: unknown[];
  exports: [exports: string, ...comments: string[]][];
  imports: [import: string, ...comments: string[]][];
  multilineComments: string[];
  singlelineComments: string[];
}>;

const getCommentSource = (
  source: string,
  pair: readonly [{end: number}, {start: number}],
): string => source.slice(pair[0].end, pair[1].start);

const onCommentError: OnCommentError<Context> = (_context, source, {start}) => {
  throwError(source.slice(start));
};

const onCommentParse: OnCommentParse<Context> = ({singlelineComments}, source, {end}, {start}) => {
  singlelineComments.push(source.slice(end, start));
};

const onError: OnParse<Context> = ({errors}, source, ...tokens) => {
  errors.push(source.slice(tokens[0]!.start, tokens[tokens.length - 1]!.end + 30));
};

const onExportParse: OnParse<Context, 3> = (
  {exports},
  source,
  exportStart,
  exportListEnd,
  exportEnd,
) => {
  const exportStartComments = exportStart.comments?.map((pair) => getCommentSource(source, pair));
  const exportListComments = exportListEnd.comments?.map((pair) => getCommentSource(source, pair));

  exports.push([
    source.slice(exportStart.end, exportEnd.start),
    ...(exportStartComments || []),
    ...(exportListComments || []),
  ]);
};

const onImportParse: OnParse<Context, 3> = (
  {imports},
  source,
  importStart,
  importFrom,
  importEnd,
) => {
  const importStartComments = importStart.comments?.map((pair) => getCommentSource(source, pair));
  const importFromComments = importFrom.comments?.map((pair) => getCommentSource(source, pair));

  imports.push([
    source.slice(importStart.end, importEnd.start),
    ...(importStartComments || []),
    ...(importFromComments || []),
  ]);
};

const parseImportsExports = createParseFunction<Context>({
  comments: [
    {
      canIncludeComments: true,
      onError: onCommentError,
      onParse: onCommentParse,
      tokens: ['\\/\\/', '$\\n?'],
      shouldSearchBeforeComments: true,
    },
    {
      canIncludeComments: true,
      onError: onCommentError,
      onParse: ({multilineComments}, source, {end}, {start}) => {
        multilineComments.push(source.slice(end, start));
      },
      tokens: ['\\/\\*', '\\*\\/'],
      shouldSearchBeforeComments: true,
    },
  ],
  onError: (_context, _source, message) => throwError(message),
  statements: [
    {
      onError,
      onParse: onImportParse as OnParse,
      tokens: ['^import\\b', '\\bfrom\\b', '$\\n?'],
    },
    {
      onError,
      onParse: onExportParse as OnParse,
      tokens: ['^export\\b', '\\}', '$\\n?'],
    },
  ],
});

const importsExports: Context = {
  errors: [],
  exports: [],
  imports: [],
  multilineComments: [],
  singlelineComments: [],
};

parseImportsExports(
  importsExports,
  `
import {foo} from './foo';
import bar from './bar'

// This is a comment

import /* some comment */ bar from bar;

'also import from bar;'

import bar from './baz'

import with error;
import // comment in import without from;

export {foo} /* also comment} */;
export /* comment in export} */ {bar}
`,
);

console.log(importsExports);
```

## Install

Requires [node](https://nodejs.org/en/) version 10 or higher:

```sh
npm install parse-statements
```

`parse-statements` ✂️ works in any environment that supports ES2018
(because package uses [RegExp Named Capture Groups](https://github.com/tc39/proposal-regexp-named-groups)).

## License

[MIT][license-url]

[conventional-commits-image]: https://img.shields.io/badge/Conventional_Commits-1.0.0-yellow.svg 'The Conventional Commits specification'
[conventional-commits-url]: https://www.conventionalcommits.org/en/v1.0.0/
[dependencies-none-image]: https://img.shields.io/badge/dependencies-none-success.svg 'No dependencies'
[dependencies-none-url]: https://github.com/joomcode/parse-statements/blob/main/package.json
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg 'The MIT License'
[license-url]: LICENSE
[npm-image]: https://img.shields.io/npm/v/parse-statements.svg 'parse-statements'
[npm-url]: https://www.npmjs.com/package/parse-statements
[prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg 'Prettier code formatter'
[prettier-url]: https://prettier.io/
[size-image]: https://img.shields.io/bundlephobia/minzip/parse-statements 'parse-statements'
[size-url]: https://bundlephobia.com/package/parse-statements
