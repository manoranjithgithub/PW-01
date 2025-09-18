module.exports = {
  root: true,
  ignorePatterns: ['projects/**/*'],
  overrides: [
    {
      files: ['*.ts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
      ],
      rules: {
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['off', { argsIgnorePattern: '^_' }],
        'no-console': ['off', { allow: ['warn', 'error'] }],
        'no-prototype-builtins': 'off',
      },
    },
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {
        '@angular-eslint/template/accessibility-alt-text': 'off',
        '@angular-eslint/template/accessibility-label-has-associated-control': 'off',
      },
    },
    {
      files: ['karma.conf.js'],
      env: {
        node: true,
      },
      rules: {
        'no-undef': 'off',
      },
      parserOptions: {
        ecmaVersion: 2020,
      },
    },
    {
      files: ['sonar-project.js', 'sonar.js'],
      env: {
        node: true,
      },
      rules: {
        'no-undef': 'off',
      },
      parserOptions: {
        ecmaVersion: 2020,
      },
    },
    {
      files: ['cypress/**/*.js', 'cypress/**/*.ts', '**/*.cy.js', '**/*.cy.ts'],
      extends: ['plugin:cypress/recommended'],
      plugins: ['cypress'],
      env: {
        'cypress/globals': true,
      },
      rules: {
        'no-unused-expressions': 'off', 
      },
    },
  ],
};
