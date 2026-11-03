import parser from '@typescript-eslint/parser';
export default [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-debugger': 'error',
      'no-unreachable': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-self-assign': 'error',
      'valid-typeof': 'error',
      'no-constant-condition': 'error',
    },
  },
];
