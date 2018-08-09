import { Animated, Easing } from 'react-native';

function isNumber(num){
  return typeof num === 'number' && Number.isFinite(num)
}

export function getAnimationValue(key, value){
  return key === 'shadowOffset' ? {
    ...(isNumber(value.height) ? { height: new Animated.Value(value.height) } : {}),
    ...(isNumber(value.width) ? { width: new Animated.Value(value.width) } : {})
  } : new Animated.Value(value);
}

export function getDefaultAnimationValue(key){
  return key === 'shadowOffset' ? {
    height: new Animated.Value(0),
    width: new Animated.Value(0),
  } : new Animated.Value(0);
}

export function setTransitionValue(key, target, value){
  if (key === 'shadowOffset'){
    if (isNumber(target.width) && isNumber(value.width)) {
      target.width.setValue(value.width);
    }
    if (isNumber(target.height) && isNumber(value.height)) {
      target.height.setValue(value.height);
    }
  } else {
    target.setValue(value);
  }
}

export function animateValue(animation, key, target, toValue, options = {}){
  if (key === 'shadowOffset'){
    return Animated.parallel(
      [
        (isNumber(target.width) && isNumber(toValue.width)) &&
          animation(target.width, { toValue: toValue.width, ...options }),
        (isNumber(target.height) && isNumber(toValue.height)) &&
          animation(target.height, { toValue: toValue.height, ...options })
      ].filter(a => a)
    )
  } else {
    return animation(target, { toValue, ...options })
  }
}
