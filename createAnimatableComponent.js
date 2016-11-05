import React, { Component, PropTypes } from 'react';
import { Animated, Easing } from 'react-native';
import wrapStyleTransforms from './wrapStyleTransforms';
import getStyleValues from './getStyleValues';
import createAnimation from './createAnimation';
import { getAnimationByName } from './registry';

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
];

const EASING_FUNCTIONS = {
  linear: Easing.linear,
  ease: Easing.ease,
  'ease-in': Easing.in(Easing.ease),
  'ease-out': Easing.out(Easing.ease),
  'ease-in-out': Easing.inOut(Easing.ease),
};

// Determine to what value the animation should tween to
function getAnimationTarget(iteration, direction) {
  switch (direction) {
    case 'reverse': return 0;
    case 'alternate': return (iteration % 2) ? 0 : 1;
    case 'alternate-reverse': return (iteration % 2) ? 1 : 0;
    case 'normal':
    default: return 1;
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

function makeInterpolatedStylesFromAnimation(compiledAnimation, animationValue) {
  const style = {};
  for (const key in compiledAnimation) {
    if (key !== 'easing') {
      style[key] = animationValue.interpolate(compiledAnimation[key]);
    }
  }
  return wrapStyleTransforms(style);
}

// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
export default function createAnimatableComponent(WrappedComponent) {
  const wrappedComponentName = WrappedComponent.displayName
    || WrappedComponent.name
    || 'Component';

  const Animatable = Animated.createAnimatedComponent(WrappedComponent);

  return class AnimatableComponent extends Component {
    static displayName = `withAnimatable(${wrappedComponentName})`;

    static propTypes = {
      animation: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
      ]),
      duration: PropTypes.number,
      direction: PropTypes.oneOf(['normal', 'reverse', 'alternate', 'alternate-reverse']),
      delay: PropTypes.number,
      easing: PropTypes.oneOf(Object.keys(EASING_FUNCTIONS)),
      iterationCount(props, propName) {
        const val = props[propName];
        if (val !== 'infinite' && !(typeof val === 'number' && val >= 1)) {
          return new Error('iterationCount must be a positive number or "infinite"');
        }
        return null;
      },
      onAnimationBegin: PropTypes.func,
      onAnimationEnd: PropTypes.func,
      style: PropTypes.any,
      transition: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
      ]),
    };

    static defaultProps = {
      iterationCount: 1,
      onAnimationBegin() {},
      onAnimationEnd() {},
    };

    constructor(props) {
      super(props);

      const animationValue = new Animated.Value(getAnimationOrigin(0, this.props.direction));
      let animationStyle = {};
      let compiledAnimation = {};
      if (props.animation) {
        compiledAnimation = getCompiledAnimation(props.animation);
        animationStyle = makeInterpolatedStylesFromAnimation(compiledAnimation, animationValue);
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
    }

    initializeTransitionState(transitionKeys) {
      const transitionValues = {};
      const styleValues = {};

      const currentTransitionValues = getStyleValues(transitionKeys, this.props.style);
      Object.keys(currentTransitionValues).forEach((key) => {
        const value = currentTransitionValues[key];
        if (INTERPOLATION_STYLE_PROPERTIES.indexOf(key) !== -1) {
          transitionValues[key] = new Animated.Value(0);
          styleValues[key] = value;
        } else {
          transitionValues[key] = styleValues[key] = new Animated.Value(value);
        }
      });

      return {
        currentTransitionValues,
        transitionStyle: styleValues,
        transitionValues,
      };
    }

    getTransitionState(keys) {
      const transitionKeys = (typeof keys === 'string' ? [keys] : keys);
      let { transitionValues, currentTransitionValues, transitionStyle } = this.state;
      const missingKeys = transitionKeys.filter(key => !this.state.transitionValues[key]);
      if (missingKeys.length) {
        const transitionState = this.initializeTransitionState(missingKeys);
        transitionValues = { ...transitionValues, ...transitionState.transitionValues };
        currentTransitionValues = { ...currentTransitionValues, ...transitionState.currentTransitionValues };
        transitionStyle = { ...transitionStyle, ...transitionState.transitionStyle };
      }
      return { transitionValues, currentTransitionValues, transitionStyle };
    }

    ref = null;
    handleRef = (ref) => {
      this.ref = ref;
    };

    setNativeProps(nativeProps) {
      if (this.ref) {
        this.ref.setNativeProps(nativeProps);
      }
    }

    componentDidMount() {
      const { animation, duration, delay, onAnimationBegin, onAnimationEnd } = this.props;
      if (animation) {
        const startAnimation = () => {
          onAnimationBegin();
          this._startAnimation(duration, 0, onAnimationEnd);
          this.delayTimer = null;
        };
        if (delay) {
          this.delayTimer = setTimeout(startAnimation, delay);
        } else {
          startAnimation();
        }
      }
    }

    componentWillReceiveProps(props) {
      const { animation, duration, easing, transition, onAnimationBegin, onAnimationEnd } = props;

      if (transition) {
        const values = getStyleValues(transition, props.style);
        this.transitionTo(values, duration, easing);
      } else if (animation !== this.props.animation) {
        if (animation) {
          if (this.delayTimer) {
            this.setAnimation(animation);
          } else {
            onAnimationBegin();
            this.animate(animation, duration).then(onAnimationEnd);
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
      const animationStyle = makeInterpolatedStylesFromAnimation(compiledAnimation, this.state.animationValue);
      this.setState({ animationStyle, compiledAnimation }, callback);
    }

    animate(animation, duration) {
      return new Promise((resolve, reject) => {
        this.setAnimation(animation, () => {
          this._startAnimation(duration, 0, resolve);
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

    _startAnimation(duration, iteration, callback) {
      const { animationValue, compiledAnimation } = this.state;
      const { direction, iterationCount } = this.props;
      let easing = compiledAnimation.easing || this.props.easing || 'ease-in-out';
      let currentIteration = iteration || 0;
      const fromValue = getAnimationOrigin(currentIteration, direction);
      const toValue = getAnimationTarget(currentIteration, direction);
      animationValue.setValue(fromValue);

      if (typeof easing === 'string') {
        easing = EASING_FUNCTIONS[easing];
      }
      // Reverse easing if on the way back
      const reversed = (
        (direction === 'reverse') ||
        (direction === 'alternate' && !toValue) ||
        (direction === 'alternate-reverse' && !toValue)
      );
      if (reversed) {
        easing = Easing.out(easing);
      }

      Animated.timing(animationValue, {
        toValue,
        easing,
        isInteraction: !iterationCount,
        duration: duration || this.props.duration || 1000,
      }).start(endState => {
        currentIteration++;
        if (endState.finished && this.props.animation && (iterationCount === 'infinite' || currentIteration < iterationCount)) {
          this._startAnimation(duration, currentIteration, callback);
        } else if (callback) {
          callback(endState);
        }
      });
    }

    transition(fromValues, toValues, duration, easing) {
      const transitionKeys = Object.keys(toValues);
      let { transitionValues, currentTransitionValues, transitionStyle } = this.getTransitionState(transitionKeys);

      transitionKeys.forEach(property => {
        const fromValue = fromValues[property];
        const toValue = toValues[property];
        let transitionValue = transitionValues[property];
        if (!transitionValue) {
          transitionValue = new Animated.Value(0);
        }
        transitionStyle[property] = transitionValue;

        if (INTERPOLATION_STYLE_PROPERTIES.indexOf(property) !== -1) {
          transitionValue.setValue(0);
          transitionStyle[property] = transitionValue.interpolate({
            inputRange: [0, 1],
            outputRange: [fromValue, toValue],
          });
          currentTransitionValues[property] = toValue;
          toValues[property] = 1;
        } else {
          transitionValue.setValue(fromValue);
        }
      });
      this.setState({ transitionValues, transitionStyle, currentTransitionValues }, () => {
        this._transitionToValues(toValues, duration || this.props.duration, easing);
      });
    }

    transitionTo(toValues, duration, easing) {
      const { currentTransitionValues } = this.state;

      let transitions = {
        from: {},
        to: {},
      };

      Object.keys(toValues).forEach(property => {
        const toValue = toValues[property];

        if (INTERPOLATION_STYLE_PROPERTIES.indexOf(property) === -1 && this.state.transitionStyle[property] && this.state.transitionStyle[property] === this.state.transitionValues[property]) {
          return this._transitionToValue(this.state.transitionValues[property], toValue, duration, easing);
        }

        let currentTransitionValue = currentTransitionValues[property];
        if (typeof currentTransitionValue === 'undefined' && this.props.style) {
          const style = getStyleValues(property, this.props.style);
          currentTransitionValue = style[property];
        }
        transitions.from[property] = currentTransitionValue;
        transitions.to[property] = toValue;
      });

      if (Object.keys(transitions.from).length) {
        this.transition(transitions.from, transitions.to, duration, easing);
      }
    }

    _transitionToValues(toValues, duration, easing) {
      Object.keys(toValues).forEach(property => {
        const transitionValue = this.state.transitionValues[property];
        const toValue = toValues[property];
        this._transitionToValue(transitionValue, toValue, duration, easing);
      });
    }

    _transitionToValue(transitionValue, toValue, duration, easing) {
      if (duration || easing) {
        Animated.timing(transitionValue, {
          toValue: toValue,
          duration: duration || 1000,
          easing: EASING_FUNCTIONS[easing || 'ease-in-out'],
        }).start();
      } else {
        Animated.spring(transitionValue, {
          toValue: toValue,
        }).start();
      }
    }

    render() {
      const { style, animation, duration, delay, transition, onAnimationBegin, onAnimationEnd, easing, iterationCount, direction, ...restProps } = this.props;
      if (animation && transition) {
        throw new Error('You cannot combine animation and transition props');
      }

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
