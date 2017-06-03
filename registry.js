import createAnimation from './createAnimation';

const animationRegistry = {};

export function registerAnimation(animationName, animation) {
  animationRegistry[animationName] = animation;
}

export function getAnimationByName(animationName) {
  return animationRegistry[animationName];
}

export function getAnimationNames() {
  return Object.keys(animationRegistry);
}

export function initializeRegistryWithDefinitions(definitions) {
  Object.keys(definitions).forEach(animationName => {
    registerAnimation(
      animationName,
      createAnimation(definitions[animationName]),
    );
  });
}
