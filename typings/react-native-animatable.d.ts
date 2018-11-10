import {
    NativeMethodsMixin,
    ViewProperties,
    TextProperties,
    ImageProperties,
    ViewStyle,
    TextStyle,
    ImageStyle
} from 'react-native';
import {
    StatelessComponent,
    ComponentClass,
    ClassicComponentClass
} from 'react';

type EasingFunction ={(t: number) :number};
type Easing =
    'linear' |
    'ease' |
    'ease-in' |
    'ease-out' |
    'ease-in-out' |
    'ease-in-cubic' |
    'ease-out-cubic' |
    'ease-in-out-cubic' |
    'ease-in-circ' |
    'ease-out-circ' |
    'ease-in-out-circ' |
    'ease-in-expo' |
    'ease-out-expo' |
    'ease-in-out-expo' |
    'ease-in-quad' |
    'ease-out-quad' |
    'ease-in-out-quad' |
    'ease-in-quart' |
    'ease-out-quart' |
    'ease-in-out-quart' |
    'ease-in-quint' |
    'ease-out-quint' |
    'ease-in-out-quint' |
    'ease-in-sine' |
    'ease-out-sine' |
    'ease-in-out-sine' |
    'ease-in-back' |
    'ease-out-back' |
    'ease-in-out-back'|
     EasingFunction;

export type Animation =
    'bounce' |
    'flash' |
    'jello' |
    'pulse' |
    'rotate' |
    'rubberBand' |
    'shake' |
    'swing' |
    'tada' |
    'wobble' |
    'bounceIn' |
    'bounceInDown' |
    'bounceInUp' |
    'bounceInLeft' |
    'bounceInRight' |
    'bounceOut' |
    'bounceOutDown' |
    'bounceOutUp' |
    'bounceOutLeft' |
    'bounceOutRight' |
    'fadeIn' |
    'fadeInDown' |
    'fadeInDownBig' |
    'fadeInUp' |
    'fadeInUpBig' |
    'fadeInLeft' |
    'fadeInLeftBig' |
    'fadeInRight' |
    'fadeInRightBig' |
    'fadeOut' |
    'fadeOutDown' |
    'fadeOutDownBig' |
    'fadeOutUp' |
    'fadeOutUpBig' |
    'fadeOutLeft' |
    'fadeOutLeftBig' |
    'fadeOutRight' |
    'fadeOutRightBig' |
    'flipInX' |
    'flipInY' |
    'flipOutX' |
    'flipOutY' |
    'lightSpeedIn' |
    'lightSpeedOut' |
    'slideInDown' |
    'slideInUp' |
    'slideInLeft' |
    'slideInRight' |
    'slideOutDown' |
    'slideOutUp' |
    'slideOutLeft' |
    'slideOutRight' |
    'zoomIn' |
    'zoomInDown' |
    'zoomInUp' |
    'zoomInLeft' |
    'zoomInRight' |
    'zoomOut' |
    'zoomOutDown' |
    'zoomOutUp' |
    'zoomOutLeft' |
    'zoomOutRight';

interface AnimatableProperties<S extends {}> {
    animation?: Animation | string;
    duration?: number;
    delay?: number;
    direction?: 'normal' | 'reverse' | 'alternate'| 'alternate-reverse';
    easing?: Easing;
    iterationCount?: number | 'infinite';
    iterationDelay?: number;
    transition?: keyof S | ReadonlyArray<keyof S>;
    useNativeDriver?: boolean;
    onAnimationBegin?: Function;
    onAnimationEnd?: Function;
    onTransitionBegin?: (property: string) => void;
    onTransitionEnd?: (property: string) => void;
}

type AnimatableAnimationMethods =
    Partial<{ [k in Animation]: (duration?: number) => Promise<{finished: boolean}> }>;

interface AnimatableComponent<P extends {}, S extends {}> extends
    NativeMethodsMixin,
    AnimatableAnimationMethods,
    ClassicComponentClass<AnimatableProperties<S> & P> {

    stopAnimation(): void;

    transition<T extends S>(
        fromValues: T,
        toValues: T,
        duration?: number,
        easing?: Easing
    ): void;

    transitionTo<T extends S>(
        toValues: T,
        duration?: number,
        easing?: Easing
    ): void;
}

export interface CustomAnimation<T = TextStyle & ViewStyle & ImageStyle> {
    from?: T;
    to?: T;
    style?: T;
    easing?: Easing;
    [progress: number]: T;
}

export function createAnimation(
    animation: CustomAnimation
) : object;

export function registerAnimation(
    name: string,
    animation: CustomAnimation
) : void;

export function initializeRegistryWithDefinitions(
    animations: { [key: string]: CustomAnimation }
) : void;

type GetPropertyType<B, K extends keyof B> = B[K];
export function createAnimatableComponent<P extends {style?: any}, S = GetPropertyType<P, 'style'>> (
    Component: ComponentClass<P> | StatelessComponent<P> | ClassicComponentClass<P>
) : AnimatableComponent<P, S>;

export const View : AnimatableComponent<ViewProperties, ViewStyle>;
export type View = AnimatableComponent<ViewProperties, ViewStyle>;
export const Text : AnimatableComponent<TextProperties, TextStyle>;
export type Text = AnimatableComponent<TextProperties, TextStyle>;
export const Image : AnimatableComponent<ImageProperties, ImageStyle>;
export type Image = AnimatableComponent<ImageProperties, ImageStyle>;
