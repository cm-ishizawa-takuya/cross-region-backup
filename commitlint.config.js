module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0, 'never', []],
    'body-case': [0, 'never', []],
  }
};
