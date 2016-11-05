import createAnimation from './createAnimation';

const animationRegistry = {};

export function registerAnimation(animationName, definition) {
  animationRegistry[animationName] = createAnimation(definition);
}

export function getAnimationByName(animationName) {
  return animationRegistry[animationName];
}
