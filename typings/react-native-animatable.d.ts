import {
  NativeMethods,
  ViewProps,
  TextProps,
  ImageProps,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import {
  FunctionComponent,
  ComponentClass,
  ClassicComponentClass,
  Component,
} from 'react';

export type EasingFunction = { (t: number): number };
export type Easing =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-circ'
  | 'ease-out-circ'
  | 'ease-in-out-circ'
  | 'ease-in-expo'
  | 'ease-out-expo'
  | 'ease-in-out-expo'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-out-quad'
  | 'ease-in-quart'
  | 'ease-out-quart'
  | 'ease-in-out-quart'
  | 'ease-in-quint'
  | 'ease-out-quint'
  | 'ease-in-out-quint'
  | 'ease-in-sine'
  | 'ease-out-sine'
  | 'ease-in-out-sine'
  | 'ease-in-back'
  | 'ease-out-back'
  | 'ease-in-out-back'
  | EasingFunction;

export type Animation =
  | 'bounce'
  | 'flash'
  | 'jello'
  | 'pulse'
  | 'rotate'
  | 'rubberBand'
  | 'shake'
  | 'swing'
  | 'tada'
  | 'wobble'
  | 'bounceIn'
  | 'bounceInDown'
  | 'bounceInUp'
  | 'bounceInLeft'
  | 'bounceInRight'
  | 'bounceOut'
  | 'bounceOutDown'
  | 'bounceOutUp'
  | 'bounceOutLeft'
  | 'bounceOutRight'
  | 'fadeIn'
  | 'fadeInDown'
  | 'fadeInDownBig'
  | 'fadeInUp'
  | 'fadeInUpBig'
  | 'fadeInLeft'
  | 'fadeInLeftBig'
  | 'fadeInRight'
  | 'fadeInRightBig'
  | 'fadeOut'
  | 'fadeOutDown'
  | 'fadeOutDownBig'
  | 'fadeOutUp'
  | 'fadeOutUpBig'
  | 'fadeOutLeft'
  | 'fadeOutLeftBig'
  | 'fadeOutRight'
  | 'fadeOutRightBig'
  | 'flipInX'
  | 'flipInY'
  | 'flipOutX'
  | 'flipOutY'
  | 'lightSpeedIn'
  | 'lightSpeedOut'
  | 'slideInDown'
  | 'slideInUp'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideOutDown'
  | 'slideOutUp'
  | 'slideOutLeft'
  | 'slideOutRight'
  | 'zoomIn'
  | 'zoomInDown'
  | 'zoomInUp'
  | 'zoomInLeft'
  | 'zoomInRight'
  | 'zoomOut'
  | 'zoomOutDown'
  | 'zoomOutUp'
  | 'zoomOutLeft'
  | 'zoomOutRight';

export type Direction =
  | 'normal'
  | 'reverse'
  | 'alternate'
  | 'alternate-reverse';

type TransformKeys =
  | 'perspective'
  | 'rotate'
  | 'rotateX'
  | 'rotateY'
  | 'rotateZ'
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'translateX'
  | 'translateY'
  | 'skewX'
  | 'skewY'
  | 'matrix';

interface AnimatableProps<S extends {}> {
  animation?: Animation | string | CustomAnimation;
  duration?: number;
  delay?: number;
  direction?: Direction;
  easing?: Easing;
  iterationCount?: number | 'infinite';
  iterationDelay?: number;
  transition?:
    | (keyof S | TransformKeys)
    | ReadonlyArray<keyof S | TransformKeys>;
  useNativeDriver?: boolean;
  isInteraction?: boolean;
  onAnimationBegin?: Function;
  onAnimationEnd?: Function;
  onTransitionBegin?: (property: string) => void;
  onTransitionEnd?: (property: string) => void;
}

type AnimatableAnimationMethods = Partial<{
  [k in Animation]: (duration?: number) => Promise<{ finished: boolean }>;
}>;

interface AnimatableComponent<P extends {}, S extends {}>
  extends NativeMethods,
    AnimatableAnimationMethods,
    Component,
    ClassicComponentClass<AnimatableProps<S> & P> {
  refs: {
    [key: string]: Component<P, S>;
  };

  stopAnimation(): void;

  animate(
    animation: Animation | CustomAnimation,
    duration?: number,
    iterationDelay?: number,
  ): Promise<void>;

  transition<T extends S>(
    fromValues: T,
    toValues: T,
    duration?: number,
    easing?: Easing,
  ): void;

  transitionTo<T extends S>(
    toValues: T,
    duration?: number,
    easing?: Easing,
  ): void;
}

export interface CustomAnimation<T = TextStyle & ViewStyle & ImageStyle> {
  from?: T;
  to?: T;
  style?: T;
  easing?: Easing;
  [progress: number]: T;
}

export function createAnimation(animation: CustomAnimation): object;

export function registerAnimation(
  name: string,
  animation: CustomAnimation,
): void;

export function initializeRegistryWithDefinitions(animations: {
  [key: string]: CustomAnimation;
}): void;

type GetPropertyType<B, K extends keyof B> = B[K];
export function createAnimatableComponent<
  P extends { style?: any },
  S = GetPropertyType<P, 'style'>,
>(
  Component:
    | ComponentClass<P>
    | FunctionComponent<P>
    | ClassicComponentClass<P>,
): AnimatableComponent<P, S>;

export const View: AnimatableComponent<ViewProps, ViewStyle>;
export type View = AnimatableComponent<ViewProps, ViewStyle>;
export const Text: AnimatableComponent<TextProps, TextStyle>;
export type Text = AnimatableComponent<TextProps, TextStyle>;
export const Image: AnimatableComponent<ImageProps, ImageStyle>;
export type Image = AnimatableComponent<ImageProps, ImageStyle>;
