import flattenStyle from './flattenStyle';
import getDefaultStyleValue from './getDefaultStyleValue';

// Returns a flattened version of style with only `keys` values.
export default function getStyleValues(keys, style) {
  const values = {};
  const flatStyle = flattenStyle(style);

  (typeof keys === 'string' ? [keys] : keys).forEach(key => {
    values[key] = key in flatStyle
      ? flatStyle[key]
      : getDefaultStyleValue(key, flatStyle);
  });
  return values;
}
