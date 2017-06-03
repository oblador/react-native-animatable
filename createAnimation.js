import flattenStyle from './flattenStyle';

function compareNumbers(a, b) {
  return a - b;
}

function notNull(value) {
  return value !== null;
}

function parsePosition(value) {
  if (value === 'from') {
    return 0;
  } else if (value === 'to') {
    return 1;
  }
  const parsed = parseFloat(value, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > 1) {
    return null;
  }
  return parsed;
}

const cache = {};

export default function createAnimation(definition) {
  const cacheKey = JSON.stringify(definition);
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  const positions = Object.keys(definition).map(parsePosition).filter(notNull);
  positions.sort(compareNumbers);

  if (positions.length < 2) {
    throw new Error('Animation definitions must have at least two values.');
  }

  const compiled = {};
  if (definition.easing) {
    compiled.easing = definition.easing;
  }
  if (definition.style) {
    compiled.style = definition.style;
  }

  for (let i = 0; i < positions.length; i += 1) {
    const position = positions[i];
    let keyframe = definition[position];
    if (!keyframe) {
      if (position === 0) {
        keyframe = definition.from;
      } else if (position === 1) {
        keyframe = definition.to;
      }
    }
    if (!keyframe) {
      throw new Error('Missing animation keyframe, this should not happen');
    }

    keyframe = flattenStyle(keyframe);
    Object.keys(keyframe).forEach(key => {
      if (!(key in compiled)) {
        compiled[key] = {
          inputRange: [],
          outputRange: [],
        };
      }
      compiled[key].inputRange.push(position);
      compiled[key].outputRange.push(keyframe[key]);
    });
  }

  cache[cacheKey] = compiled;

  return compiled;
}
