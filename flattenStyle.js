import { StyleSheet } from 'react-native';

export default function flattenStyle(style) {
  const flatStyle = Object.assign({}, StyleSheet.flatten(style));
  if (flatStyle.transform) {
    flatStyle.transform.forEach(transform => {
      const key = Object.keys(transform)[0];
      flatStyle[key] = transform[key];
    });
    delete flatStyle.transform;
  }
  return flatStyle;
}
