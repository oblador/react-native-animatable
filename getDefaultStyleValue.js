export default function getDefaultStyleValue(key) {
  if (key === 'backgroundColor') {
    return 'rgba(0,0,0,0)';
  }
  if (key === 'color' || key.indexOf('Color') !== -1) {
    return 'rgba(0,0,0,1)';
  }
  if (key.indexOf('rotate') !== -1 || key.indexOf('skew') !== -1) {
    return '0deg';
  }
  if (key === 'fontSize') {
    return 14;
  }
  if (key === 'opacity') {
    return 1;
  }
  return 0;
}
