import flattenStyle from './flattenStyle';

function compareNumbers(a, b) {
  return a - b;
}

function parsePosition(value) {
  if (value === 'from') {
    return 0;
  } else if (value === 'to') {
    return 1;
  }
  const parsed = parseFloat(value, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`Invalid animation position ${value}, should be from|to|0-1.`);
  }
  return parsed;
}

export default function createAnimation(definition) {
  const positions = Object.keys(definition).map(parsePosition);
  positions.sort(compareNumbers);

  if (positions.length < 2) {
    throw new Error('Animation definitions must have at least two values.');
  }

  const compiled = {};
  for (const position of positions) {
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
    for (const key in keyframe) {
      if (!(key in compiled)) {
        compiled[key] = {
          inputRange: [],
          outputRange: [],
        };
      }
      compiled[key].inputRange.push(position);
      compiled[key].outputRange.push(keyframe[key]);
    }
  }

  return compiled;
}
