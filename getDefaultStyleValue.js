/* eslint-disable no-plusplus */

const DIRECTIONAL_FALLBACKS = {
  Top: ['Vertical', ''],
  Bottom: ['Vertical', ''],
  Vertical: [''],
  Left: ['Horizontal', ''],
  Right: ['Horizontal', ''],
  Horizontal: [''],
};

const DIRECTIONAL_SUFFICES = Object.keys(DIRECTIONAL_FALLBACKS);

export default function getDefaultStyleValue(key, flatStyle) {
  if (key === 'backgroundColor') {
    return 'rgba(0,0,0,0)';
  }
  if (key === 'color' || key.indexOf('Color') !== -1) {
    return 'rgba(0,0,0,1)';
  }
  if (key.indexOf('rotate') === 0 || key.indexOf('skew') === 0) {
    return '0deg';
  }
  if (key === 'opacity' || key.indexOf('scale') === 0) {
    return 1;
  }
  if (key === 'fontSize') {
    return 14;
  }
  if (key.indexOf('margin') === 0 || key.indexOf('padding') === 0) {
    for (let suffix, i = 0; i < DIRECTIONAL_SUFFICES.length; i++) {
      suffix = DIRECTIONAL_SUFFICES[i];
      if (key.substr(-suffix.length) === suffix) {
        const prefix = key.substr(0, key.length - suffix.length);
        const fallbacks = DIRECTIONAL_FALLBACKS[suffix];
        for (let fallback, j = 0; j < fallbacks.length; j++) {
          fallback = prefix + fallbacks[j];
          if (fallback in flatStyle) {
            return flatStyle[fallback];
          }
        }
        break;
      }
    }
  }
  return 0;
}
