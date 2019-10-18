import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing } from 'react-native';
import wrapStyleTransforms from './wrapStyleTransforms';
import getStyleValues from './getStyleValues';
import flattenStyle from './flattenStyle';
import createAnimation from './createAnimation';
import { getAnimationByName, getAnimationNames } from './registry';
import EASING_FUNCTIONS from './easing';

// These styles are not number based and thus needs to be interpolated
const INTERPOLATION_STYLE_PROPERTIES = [
  // Transform styles
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'skewX',
  'skewY',
  'transformMatrix',
  // View styles
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'shadowColor',
  // Text styles
  'color',
  'textDecorationColor',
  // Image styles
  'tintColor',
];

const ZERO_CLAMPED_STYLE_PROPERTIES = ['width', 'height'];

// Create a copy of `source` without `keys`
function omit(keys, source) {
  const filtered = {};
  Object.keys(source).forEach(key => {
    if (keys.indexOf(key) === -1) {
      filtered[key] = source[key];
    }
  });
  return filtered;
}

// Yes it's absurd, but actually fast
function deepEquals(a, b) {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

// Determine to what value the animation should tween to
function getAnimationTarget(iteration, direction) {
  switch (direction) {
    case 'reverse':
      return 0;
    case 'alternate':
      return iteration % 2 ? 0 : 1;
    case 'alternate-reverse':
      return iteration % 2 ? 1 : 0;
    case 'normal':
    default:
      return 1;
  }
}

// Like getAnimationTarget but opposite
function getAnimationOrigin(iteration, direction) {
  return getAnimationTarget(iteration, direction) ? 0 : 1;
}

function getCompiledAnimation(animation) {
  if (typeof animation === 'string') {
    const compiledAnimation = getAnimationByName(animation);
    if (!compiledAnimation) {
      throw new Error(`No animation registred by the name of ${animation}`);
    }
    return compiledAnimation;
  }
  return createAnimation(animation);
}

function makeInterpolatedStyle(compiledAnimation, animationValue) {
  const style = {};
  Object.keys(compiledAnimation).forEach(key => {
    if (key === 'style') {
      Object.assign(style, compiledAnimation.style);
    } else if (key !== 'easing') {
      style[key] = animationValue.interpolate(compiledAnimation[key]);
    }
  });
  return wrapStyleTransforms(style);
}

function transitionToValue(
  property,
  transitionValue,
  toValue,
  duration,
  easing,
  useNativeDriver = false,
  delay,
  onTransitionBegin,
  onTransitionEnd,
) {
  const animation =
    duration || easing || delay
      ? Animated.timing(transitionValue, {
          toValue,
          delay,
          duration: duration || 1000,
          easing:
            typeof easing === 'function'
              ? easing
              : EASING_FUNCTIONS[easing || 'ease'],
          useNativeDriver,
        })
      : Animated.spring(transitionValue, { toValue, useNativeDriver });
  setTimeout(() => onTransitionBegin(property), delay);
  animation.start(() => onTransitionEnd(property));
}

// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
export default function createAnimatableComponent(WrappedComponent) {
  const wrappedComponentName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const Animatable = Animated.createAnimatedComponent(WrappedComponent);

  return class AnimatableComponent extends Component {
    static displayName = `withAnimatable(${wrappedComponentName})`;

    static propTypes = {
      animation: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      duration: PropTypes.number,
      direction: PropTypes.oneOf([
        'normal',
        'reverse',
        'alternate',
        'alternate-reverse',
      ]),
      delay: PropTypes.number,
      easing: PropTypes.oneOfType([
        PropTypes.oneOf(Object.keys(EASING_FUNCTIONS)),
        PropTypes.func,
      ]),
      iterationCount(props, propName) {
        const val = props[propName];
        if (val !== 'infinite' && !(typeof val === 'number' && val >= 1)) {
          return new Error(
            'iterationCount must be a positive number or "infinite"',
          );
        }
        return null;
      },
      iterationDelay: PropTypes.number,
      onAnimationBegin: PropTypes.func,
      onAnimationEnd: PropTypes.func,
      onTransitionBegin: PropTypes.func,
      onTransitionEnd: PropTypes.func,
      style: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.array,
        PropTypes.object,
      ]),
      transition: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
      ]),
      useNativeDriver: PropTypes.bool,
      isInteraction: PropTypes.bool,
    };

    static defaultProps = {
      animation: undefined,
      delay: 0,
      direction: 'normal',
      duration: undefined,
      easing: undefined,
      iterationCount: 1,
      iterationDelay: 0,
      onAnimationBegin() {},
      onAnimationEnd() {},
      onTransitionBegin() {},
      onTransitionEnd() {},
      style: undefined,
      transition: undefined,
      useNativeDriver: false,
      isInteraction: undefined,
    };

    constructor(props) {
      super(props);

      const animationValue = new Animated.Value(
        getAnimationOrigin(0, this.props.direction),
      );
      let animationStyle = {};
      let compiledAnimation = {};
      if (props.animation) {
        compiledAnimation = getCompiledAnimation(props.animation);
        animationStyle = makeInterpolatedStyle(
          compiledAnimation,
          animationValue,
        );
      }
      this.state = {
        animationValue,
        animationStyle,
        compiledAnimation,
        transitionStyle: {},
        transitionValues: {},
        currentTransitionValues: {},
      };

      if (props.transition) {
        this.state = {
          ...this.state,
          ...this.initializeTransitionState(props.transition),
        };
      }
      this.delayTimer = null;

      // Alias registered animations for backwards compatibility
      getAnimationNames().forEach(animationName => {
        if (!(animationName in this)) {
          this[animationName] = this.animate.bind(this, animationName);
        }
      });
    }

    initializeTransitionState(transitionKeys) {
      const transitionValues = {};
      const styleValues = {};

      const currentTransitionValues = getStyleValues(
        transitionKeys,
        this.props.style,
      );
      Object.keys(currentTransitionValues).forEach(key => {
        const value = currentTransitionValues[key];
        if (
          INTERPOLATION_STYLE_PROPERTIES.indexOf(key) !== -1 ||
          typeof value !== 'number'
        ) {
          transitionValues[key] = new Animated.Value(0);
          styleValues[key] = value;
        } else {
          const animationValue = new Animated.Value(value);
          transitionValues[key] = animationValue;
          styleValues[key] = animationValue;
        }
      });

      return {
        currentTransitionValues,
        transitionStyle: styleValues,
        transitionValues,
      };
    }

    getTransitionState(keys) {
      const transitionKeys = typeof keys === 'string' ? [keys] : keys;
      let {
        transitionValues,
        currentTransitionValues,
        transitionStyle,
      } = this.state;
      const missingKeys = transitionKeys.filter(
        key => !this.state.transitionValues[key],
      );
      if (missingKeys.length) {
        const transitionState = this.initializeTransitionState(missingKeys);
        transitionValues = {
          ...transitionValues,
          ...transitionState.transitionValues,
        };
        currentTransitionValues = {
          ...currentTransitionValues,
          ...transitionState.currentTransitionValues,
        };
        transitionStyle = {
          ...transitionStyle,
          ...transitionState.transitionStyle,
        };
      }
      return { transitionValues, currentTransitionValues, transitionStyle };
    }

    ref = null;

    handleRef = ref => {
      this.ref = ref;
    };

    setNativeProps(nativeProps) {
      if (this.ref) {
        this.ref.setNativeProps(nativeProps);
      }
    }

    componentDidMount() {
      const {
        animation,
        duration,
        delay,
        onAnimationBegin,
        iterationDelay,
      } = this.props;
      if (animation) {
        const startAnimation = () => {
          onAnimationBegin();
          this.startAnimation(duration, 0, iterationDelay, endState =>
            this.props.onAnimationEnd(endState),
          );
          this.delayTimer = null;
        };
        if (delay) {
          this.delayTimer = setTimeout(startAnimation, delay);
        } else {
          startAnimation();
        }
      }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(props) {
      const {
        animation,
        delay,
        duration,
        easing,
        iterationDelay,
        transition,
        onAnimationBegin,
      } = props;

      if (transition) {
        const values = getStyleValues(transition, props.style);
        this.transitionTo(values, duration, easing, delay);
      } else if (!deepEquals(animation, this.props.animation)) {
        if (animation) {
          if (this.delayTimer) {
            this.setAnimation(animation);
          } else {
            onAnimationBegin();
            this.animate(animation, duration, iterationDelay).then(endState =>
              this.props.onAnimationEnd(endState),
            );
          }
        } else {
          this.stopAnimation();
        }
      }
    }

    componentWillUnmount() {
      if (this.delayTimer) {
        clearTimeout(this.delayTimer);
      }
    }

    setAnimation(animation, callback) {
      const compiledAnimation = getCompiledAnimation(animation);
      this.setState(
        state => ({
          animationStyle: makeInterpolatedStyle(
            compiledAnimation,
            state.animationValue,
          ),
          compiledAnimation,
        }),
        callback,
      );
    }

    animate(animation, duration, iterationDelay) {
      return new Promise(resolve => {
        this.setAnimation(animation, () => {
          this.startAnimation(duration, 0, iterationDelay, resolve);
        });
      });
    }

    stopAnimation() {
      this.setState({
        scheduledAnimation: false,
        animationStyle: {},
      });
      this.state.animationValue.stopAnimation();
      if (this.delayTimer) {
        clearTimeout(this.delayTimer);
        this.delayTimer = null;
      }
    }

    startAnimation(duration, iteration, iterationDelay, callback) {
      const { animationValue, compiledAnimation } = this.state;
      const { direction, iterationCount, useNativeDriver, isInteraction } = this.props;
      let easing = this.props.easing || compiledAnimation.easing || 'ease';
      let currentIteration = iteration || 0;
      const fromValue = getAnimationOrigin(currentIteration, direction);
      const toValue = getAnimationTarget(currentIteration, direction);
      animationValue.setValue(fromValue);

      if (typeof easing === 'string') {
        easing = EASING_FUNCTIONS[easing];
      }
      // Reverse easing if on the way back
      const reversed =
        direction === 'reverse' ||
        (direction === 'alternate' && !toValue) ||
        (direction === 'alternate-reverse' && !toValue);
      if (reversed) {
        easing = Easing.out(easing);
      }
      const config = {
        toValue,
        easing,
        isInteraction: typeof isInteraction !== "undefined" ? isInteraction : iterationCount <= 1,
        duration: duration || this.props.duration || 1000,
        useNativeDriver,
        delay: iterationDelay || 0,
      };

      Animated.timing(animationValue, config).start(endState => {
        currentIteration += 1;
        if (
          endState.finished &&
          this.props.animation &&
          (iterationCount === 'infinite' || currentIteration < iterationCount)
        ) {
          this.startAnimation(
            duration,
            currentIteration,
            iterationDelay,
            callback,
          );
        } else if (callback) {
          callback(endState);
        }
      });
    }

    transition(fromValues, toValues, duration, easing) {
      const fromValuesFlat = flattenStyle(fromValues);
      const toValuesFlat = flattenStyle(toValues);
      const transitionKeys = Object.keys(toValuesFlat);
      const {
        transitionValues,
        currentTransitionValues,
        transitionStyle,
      } = this.getTransitionState(transitionKeys);

      transitionKeys.forEach(property => {
        const fromValue = fromValuesFlat[property];
        const toValue = toValuesFlat[property];
        let transitionValue = transitionValues[property];
        if (!transitionValue) {
          transitionValue = new Animated.Value(0);
        }
        const needsInterpolation =
          INTERPOLATION_STYLE_PROPERTIES.indexOf(property) !== -1 ||
          typeof value !== 'number';
        const needsZeroClamping =
          ZERO_CLAMPED_STYLE_PROPERTIES.indexOf(property) !== -1;
        if (needsInterpolation) {
          transitionValue.setValue(0);
          transitionStyle[property] = transitionValue.interpolate({
            inputRange: [0, 1],
            outputRange: [fromValue, toValue],
          });
          currentTransitionValues[property] = toValue;
          toValuesFlat[property] = 1;
        } else {
          if (needsZeroClamping) {
            transitionStyle[property] = transitionValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
              extrapolateLeft: 'clamp',
            });
            currentTransitionValues[property] = toValue;
          } else {
            transitionStyle[property] = transitionValue;
          }
          transitionValue.setValue(fromValue);
        }
      });
      this.setState(
        { transitionValues, transitionStyle, currentTransitionValues },
        () => {
          this.transitionToValues(
            toValuesFlat,
            duration || this.props.duration,
            easing,
            this.props.delay,
          );
        },
      );
    }

    transitionTo(toValues, duration, easing, delay) {
      const { currentTransitionValues } = this.state;
      const toValuesFlat = flattenStyle(toValues);
      const transitions = {
        from: {},
        to: {},
      };

      Object.keys(toValuesFlat).forEach(property => {
        const toValue = toValuesFlat[property];
        const needsInterpolation =
          INTERPOLATION_STYLE_PROPERTIES.indexOf(property) !== -1 ||
          typeof value !== 'number';
        const needsZeroClamping =
          ZERO_CLAMPED_STYLE_PROPERTIES.indexOf(property) !== -1;
        const transitionStyle = this.state.transitionStyle[property];
        const transitionValue = this.state.transitionValues[property];
        if (
          !needsInterpolation &&
          !needsZeroClamping &&
          transitionStyle &&
          transitionStyle === transitionValue
        ) {
          transitionToValue(
            property,
            transitionValue,
            toValue,
            duration,
            easing,
            this.props.useNativeDriver,
            delay,
            prop => this.props.onTransitionBegin(prop),
            prop => this.props.onTransitionEnd(prop),
          );
        } else {
          let currentTransitionValue = currentTransitionValues[property];
          if (
            typeof currentTransitionValue === 'undefined' &&
            this.props.style
          ) {
            const style = getStyleValues(property, this.props.style);
            currentTransitionValue = style[property];
          }
          transitions.from[property] = currentTransitionValue;
          transitions.to[property] = toValue;
        }
      });

      if (Object.keys(transitions.from).length) {
        this.transition(transitions.from, transitions.to, duration, easing);
      }
    }

    transitionToValues(toValues, duration, easing, delay) {
      Object.keys(toValues).forEach(property => {
        const transitionValue = this.state.transitionValues[property];
        const toValue = toValues[property];
        transitionToValue(
          property,
          transitionValue,
          toValue,
          duration,
          easing,
          this.props.useNativeDriver,
          delay,
          prop => this.props.onTransitionBegin(prop),
          prop => this.props.onTransitionEnd(prop),
        );
      });
    }

    render() {
      const { style, animation, transition } = this.props;
      if (animation && transition) {
        throw new Error('You cannot combine animation and transition props');
      }
      const restProps = omit(
        [
          'animation',
          'duration',
          'direction',
          'delay',
          'easing',
          'iterationCount',
          'iterationDelay',
          'onAnimationBegin',
          'onAnimationEnd',
          'onTransitionBegin',
          'onTransitionEnd',
          'style',
          'transition',
          'useNativeDriver',
          'isInteraction',
        ],
        this.props,
      );

      return (
        <Animatable
          ref={this.handleRef}
          style={[
            style,
            this.state.animationStyle,
            wrapStyleTransforms(this.state.transitionStyle),
          ]}
          {...restProps}
        />
      );
    }
  };
}
