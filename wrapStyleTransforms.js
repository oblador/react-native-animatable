// These styles need to be nested in a transform array
const TRANSFORM_STYLE_PROPERTIES = [
  'perspective',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scale',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY',
  'translateX',
  'translateY',
];

// Transforms { translateX: 1 } to { transform: [{ translateX: 1 }]}
export default function wrapStyleTransforms(style) {
  const wrapped = {};
  Object.keys(style).forEach(key => {
    if (TRANSFORM_STYLE_PROPERTIES.indexOf(key) !== -1) {
      if (!wrapped.transform) {
        wrapped.transform = [];
      }
      wrapped.transform.push({
        [key]: style[key],
      });
    } else {
      wrapped[key] = style[key];
    }
  });
  return wrapped;
}
