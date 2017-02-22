// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    "no-console": 0,
    "no-else-return": 0,
    "no-empty": 0,
    "no-new": 0,
    "no-alert": 0,
    "no-unused-vars": ["error", { "vars": "all", "args": "none" }],
    "default-case": 0,
    "func-names": 0,
    "no-var": 0,
    "no-shadow": 0,
    "no-underscore-dangle": 0,
    "no-param-reassign": 0,
    "no-unneeded-ternary": 0,
    "newline-per-chained-call": 0,
    "consistent-return": 0,
    "padded-blocks": 0,
    "global-require": 0,

    "prefer-arrow-callback": 0,
    "arrow-body-style": 0,

    "indent": [2, 2, {
        "VariableDeclarator": 2,
        "SwitchCase": 1
    }],
    "comma-dangle": [2, "never"],
    "space-before-function-paren": 0,

    "prefer-template": 0,
    "object-shorthand": 0,
    "array-bracket-spacing": 0,
    "array-callback-return": 0,
    "new-cap": 0,
    "max-len": 0,
    "import/no-mutable-exports": 0,
    'semi': 0
  }
}
