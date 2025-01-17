module.exports = {
  env: {
    browser: false,
    es2021: true,
  },
  extends: ['plugin:@shopify/typescript', 'plugin:@shopify/prettier'],
  ignorePatterns: ['build/', 'tmp/', 'dist/', 'coverage/'],
  rules: {
    'no-console': 0,
    '@typescript-eslint/naming-convention': 0,
  },
  overrides: [
    {
      files: ['**/.eslintrc.cjs'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
};
