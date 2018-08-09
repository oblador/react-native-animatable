import {
  View as CoreView,
  Text as CoreText,
  Image as CoreImage,
} from 'react-native';
import createComponent from './createAnimatableComponent';
import { initializeRegistryWithDefinitions } from './registry';
import * as ANIMATION_DEFINITIONS from './definitions';

initializeRegistryWithDefinitions(ANIMATION_DEFINITIONS);

export const createAnimatableComponent = createComponent;
export const View = createComponent(CoreView);
export const Text = createComponent(CoreText);
export const Image = createComponent(CoreImage);
export { default as createAnimation } from './createAnimation';
export {
  registerAnimation,
  initializeRegistryWithDefinitions,
} from './registry';
