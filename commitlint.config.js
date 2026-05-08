module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'chore', 'docs',
      'style', 'refactor', 'test', 'revert'
    ]],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
}
