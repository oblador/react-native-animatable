module.exports = {
  extends: ['airbnb', 'prettier'],
  plugins: ['prettier'],
  parser: '@babel/eslint-parser',
  rules: {
    'react/sort-comp': [0],
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/static-property-placement': [0],
    'react/destructuring-assignment': [0],
    'react/jsx-props-no-spreading': [0],
    'import/no-extraneous-dependencies': [0],
    'import/no-unresolved': [2, { ignore: ['^react(-native)?$'] }],
    'import/extensions': [2, { js: 'never', json: 'always' }],
    'prefer-object-spread': [0],
    'default-param-last': [0],
  },
};
