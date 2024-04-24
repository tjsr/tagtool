import eslint from '@eslint/js';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import google from 'eslint-config-google';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config( {
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
  ],
  files: ['**/*.ts'],
  ignores: ['dist/**'],
  plugins: { 'prettier': eslintPluginPrettier },
  rules: {
    ...google.rules,
    ...prettier.rules,
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'arrow-spacing': 'error',
    'brace-style': 'error',
    'camelcase': 'off',
    'comma-dangle': ['error', { 'arrays': 'always-multiline', 'functions': 'never', 'objects': 'always-multiline' }],
    'eol-last': ['error'],
    'guard-for-in': 'off',
    'indent': ['error', 2],
    'keyword-spacing': 'error',
    'linebreak-style': 'off',
    'max-len': ['error', { 'code': 120 }],
    'new-cap': 'error',
    // We eventually want to disable no-explicit-any
    'no-explicit-any': 'off',
    'no-extend-native': 'warn',
    'object-curly-spacing': ['error', 'always'],
    'operator-linebreak': ['error'],
    'quotes': ['error', 'single'],
    'require-jsdoc': 'off',
    'requireConfigFile': 'off',
    // "space-before-function-paren" was causing all kinds fo headaches because prettier won't honour it.
    'semi': ['error'],
    'semi-spacing': 'off',
    'sort-imports': 'error',
    'sort-keys': 'error',
    'sort-vars': 'error',
    'space-before-function-paren': 'off',
    // "react-hooks/rules-of-hooks": "error",
    // "react-hooks/exhaustive-deps": "warn"
  },
});
