import React, {
  Component,
  PropTypes,
} from 'react';

import ReactNative, {
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
} from 'react-native';

// Transform an object to an array the way react native wants it for transform styles
// { a: x, b: y } => [{ a: x }, { b: y }]
function createKeyedArray(obj) {
  return Object.keys(obj).map(key => {
    let keyed = {};
    keyed[key] = obj[key];
    return keyed;
  });
}

// Helper function to calculate transform values, args:
// direction: in|out
// originOrDestination: up|down|left|right
// verticalValue: amplitude for up/down animations
// horizontalValue: amplitude for left/right animations
function getAnimationValueForDirection(direction, originOrDestination, verticalValue, horizontalValue) {
  const isVertical = originOrDestination === 'up' || originOrDestination === 'down';
  const modifier = (isVertical && direction === 'out' ? -1 : 1) * (originOrDestination === 'down' || originOrDestination === 'left' ? -1 : 1);
  return modifier * (isVertical ? verticalValue : horizontalValue);
}

// Animations starting with these keywords use element dimensions
// thus, any animation needs to be deferred until the element is measured
const LAYOUT_DEPENDENT_ANIMATIONS = [
  'slide',
  'fade',
  'wobble',
  'lightSpeed',
];

// These styles need to be nested in a transform array
const TRANSFORM_STYLE_PROPERTIES = [
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'scale',
  'scaleX',
  'scaleY',
  'translateX',
  'translateY',
  'skewX',
  'skewY',
];

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
  'linear': Easing.linear,
  'ease': Easing.ease,
  'ease-in': Easing.in(Easing.ease),
  'ease-out': Easing.out(Easing.ease),
  'ease-in-out': Easing.inOut(Easing.ease),
};

// Transforms { translateX: 1 } to { transform: [{ translateX: 1 }]}
function wrapStyleTransforms(style) {
  let wrapped = {};
  Object.keys(style).forEach(key => {
    if (TRANSFORM_STYLE_PROPERTIES.indexOf(key) !== -1) {
      if (!wrapped.transform) {
        wrapped.transform = [];
      }
      wrapped.transform.push({
        [key]: style[key],
      });
    } else {
      wrapped[key] = style[key];
    }
  });
  return wrapped;
}

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

function getDefaultStyleValue(key) {
  if (key === 'backgroundColor') {
    return 'rgba(0,0,0,0)';
  }
  if (key === 'color' || key.indexOf('Color') !== -1) {
    return 'rgba(0,0,0,1)';
  }
  if (key.indexOf('rotate') !== -1 || key.indexOf('skew') !== -1) {
    return '0deg';
  }
  if (key === 'fontSize') {
    return 14;
  }
  if (key === 'opacity') {
    return 1;
  }
  return 0;
}

// Returns a flattened version of style with only `keys` values.
function getStyleValues(keys, style) {
  if (!StyleSheet.flatten) {
    throw new Error('StyleSheet.flatten not available, upgrade React Native or polyfill with StyleSheet.flatten = require(\'flattenStyle\');');
  }
  let values = {};
  let flatStyle = Object.assign({}, StyleSheet.flatten(style));
  if (flatStyle.transform) {
    flatStyle.transform.forEach(transform => {
      const key = Object.keys(transform)[0];
      flatStyle[key] = transform[key];
    });
    delete flatStyle.transform;
  }

  (typeof keys === 'string' ? [keys] : keys).forEach(key => {
    values[key] = (key in flatStyle ? flatStyle[key] : getDefaultStyleValue(key));
  });
  return values;
}

// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
export function createAnimatableComponent(component) {
  const Animatable = Animated.createAnimatedComponent(component);
  return class AnimatableComponent extends Component {
    static propTypes = {
      animation: PropTypes.string,
      duration: PropTypes.number,
      direction: PropTypes.oneOf(['normal', 'reverse', 'alternate', 'alternate-reverse']),
      delay: PropTypes.number,
      easing: PropTypes.oneOf(Object.keys(EASING_FUNCTIONS)),
      iterationCount(props, propName, componentName) {
        const val = props[propName];
        if (val !== 'infinite' && !(typeof val === 'number' && val >= 1)) {
          return new Error('iterationCount must be a positive number or "infinite"');
        }
      },
      onAnimationBegin: PropTypes.func,
      onAnimationEnd: PropTypes.func,
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

      this.state = {
        animationValue: new Animated.Value(getAnimationOrigin(0, this.props.direction)),
        animationStyle: {},
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
    }

    initializeTransitionState(transitionKeys) {
      let transitionValues = {};
      let styleValues = {};

      const currentTransitionValues = getStyleValues(transitionKeys, this.props.style);
      Object.keys(currentTransitionValues).forEach(key => {
        const value = currentTransitionValues[key];
        if (INTERPOLATION_STYLE_PROPERTIES.indexOf(key) !== -1) {
          transitionValues[key] = new Animated.Value(0);
          styleValues[key] = value;
        } else {
          transitionValues[key] = styleValues[key] = new Animated.Value(value);
        }
      });

      return {
        transitionStyle: styleValues,
        transitionValues: transitionValues,
        currentTransitionValues: currentTransitionValues,
      };
    }

    getTransitionState(keys) {
      const transitionKeys = (typeof transitionKeys === 'string' ? [keys] : keys);
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

    setNativeProps(nativeProps) {
      if (this._root) {
        this._root.setNativeProps(nativeProps);
      }
    }

    componentDidMount() {
      const { animation, duration, delay, onAnimationBegin, onAnimationEnd } = this.props;
      if (animation) {
        if (delay) {
          this.setState({ scheduledAnimation: animation });
          this._timer = setTimeout(() =>{
            onAnimationBegin();
            this.setState({ scheduledAnimation: false }, () => this[animation](duration).then(onAnimationEnd));
            this._timer = false;
          }, delay);
          return;
        }
        if (!this._layout) {
          for (let i = LAYOUT_DEPENDENT_ANIMATIONS.length - 1; i >= 0; i--) {
            if (animation.indexOf(LAYOUT_DEPENDENT_ANIMATIONS[i]) === 0) {
              this.setState({ scheduledAnimation: animation });
              return;
            }
          }
        }
        onAnimationBegin();
        this[animation](duration).then(onAnimationEnd);
      }
    }

    componentWillUnmount() {
      if (this._timer) {
        clearTimeout(this._timer);
      }
    }

    componentWillReceiveProps(props) {
      const { animation, duration, easing, transition, onAnimationBegin, onAnimationEnd } = props;

      if (transition) {
        const values = getStyleValues(transition, props.style);
        this.transitionTo(values, duration, easing);
      } else if (animation !== this.props.animation) {
        if (animation) {
          if (this.state.scheduledAnimation) {
            this.setState({ scheduledAnimation: animation });
          } else {
            onAnimationBegin();
            this[animation](duration).then(onAnimationEnd);
          }
        } else {
          this.stopAnimation();
        }
      }
    }

    _handleLayout(event) {
      const { duration, onLayout, onAnimationBegin, onAnimationEnd } = this.props;
      const { scheduledAnimation } = this.state;

      this._layout = event.nativeEvent.layout;
      if (onLayout) {
        onLayout(event);
      }

      if (scheduledAnimation && !this._timer) {
        onAnimationBegin();
        this.setState({ scheduledAnimation: false }, () => {
          this[scheduledAnimation](duration).then(onAnimationEnd);
        });
      }
    }

    animate(duration, animationStyle) {
      return new Promise((resolve, reject) => {
        this.setState({ animationStyle }, () => {
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
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = false;
      }
    }

    _startAnimation(duration, iteration, callback) {
      const { animationValue } = this.state;
      const { direction, iterationCount } = this.props;
      let easing = this.props.easing || 'ease-in-out';
      let currentIteration = iteration || 0;
      const fromValue = getAnimationOrigin(currentIteration, direction);
      const toValue = getAnimationTarget(currentIteration, direction);
      animationValue.setValue(fromValue);

      // This is on the way back reverse
      if ((
          (direction === 'reverse') ||
          (direction === 'alternate' && !toValue) ||
          (direction === 'alternate-reverse' && !toValue)
        ) && easing.match(/^ease\-(in|out)$/)) {
        if (easing.indexOf('-in') !== -1) {
          easing = easing.replace('-in', '-out');
        } else {
          easing = easing.replace('-out', '-in');
        }
      }
      Animated.timing(animationValue, {
        toValue: toValue,
        easing: EASING_FUNCTIONS[easing],
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

    bounce(duration) {
      return this.animate(duration, {
        transform: [{
          translateY: this.state.animationValue.interpolate({
            inputRange: [0, 0.2, 0.4, 0.43, 0.53, 0.7, 0.8, 0.9, 1],
            outputRange: [0, 0, -30, -30, 0, -15, 0, -4, 0],
          }),
        }],
      });
    }

    flash(duration, times = 2) {
      let inputRange = [0];
      let outputRange = [1];
      const totalTimes = times * 2;

      for (let i = 1; i <= totalTimes; i++) {
        inputRange.push(i / totalTimes);
        outputRange.push(i % 2 ? 0 : 1);
      }
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange,
          outputRange,
        }),
      });
    }

    jello(duration, skew = 12.5, times = 4) {
      let inputRange = [0];
      let outputRange = ['0 deg'];
      const totalTimes = times * 2;

      for (let i = 1; i < totalTimes; i++) {
        inputRange.push(i / totalTimes);
        outputRange.push(skew / i * (i % 2 ? -1 : 1) + ' deg');
      }
      inputRange.push(1);
      outputRange.push('0 deg');

      return this.animate(duration, {
        transform: [{
          skewX: this.state.animationValue.interpolate({ inputRange, outputRange }),
        }, {
          skewY: this.state.animationValue.interpolate({ inputRange, outputRange }),
        }],
      });
    }

    pulse(duration) {
      return this.animate(duration, {
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1],
          }),
        }],
      });
    }

    rotate(duration) {
      return this.animate(duration, {
        transform: [{
          rotate: this.state.animationValue.interpolate({
            inputRange: [0, 0.25, 0.5, 0.75, 1],
            outputRange: ['0 deg', '90 deg', '180 deg', '270 deg', '360 deg'],
          }),
        }],
      });
    }

    rubberBand(duration) {
      return this.animate(duration, {
        transform: [{
          scaleX: this.state.animationValue.interpolate({
            inputRange: [0, 0.3, 0.4, 0.5, 0.65, 0.75, 1],
            outputRange: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
          }),
        }, {
          scaleY: this.state.animationValue.interpolate({
            inputRange: [0, 0.3, 0.4, 0.5, 0.65, 0.75, 1],
            outputRange: [1, 0.75, 1.25, 0.85, 1.05, 0.95, 1],
          }),
        }],
      });
    }

    shake(duration, distance = 10, times = 5) {
      let inputRange = [0];
      let outputRange = [0];

      for (let i = 1; i <= times; i++) {
        inputRange.push(i / times);
        outputRange.push(i === times ? 0 : (i % 2 ? 1 : -1) * distance);
      }
      return this.animate(duration, {
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange,
            outputRange,
          }),
        }],
      });
    }

    swing(duration) {
      return this.animate(duration, {
        transform: [{
          rotateZ: this.state.animationValue.interpolate({
            inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
            outputRange: ['0 deg', '15 deg', '-10 deg', '5 deg', '-5 deg', '0 deg'],
          }),
        }],
      });
    }

    tada(duration) {
      return this.animate(duration, {
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 0.1, 0.2, 0.3, 0.9, 1],
            outputRange: [1, 0.9, 0.9, 1.1, 1.1, 1],
          }),
        }, {
          rotateZ: this.state.animationValue.interpolate({
            inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
            outputRange: ['0 deg', '-3 deg', '-3 deg', '3 deg', '-3 deg', '3 deg', '-3 deg', '3 deg', '-3 deg', '3 deg', '0 deg'],
          }),
        }],
      });
    }

    wobble(duration) {
      const width = (this._layout || Dimensions.get('window')).width;

      return this.animate(duration, {
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
            outputRange: [0, -0.25 * width, 0.2 * width, -0.15 * width, 0.1 * width, -0.05 * width, 1],
          }),
        }, {
          rotateZ: this.state.animationValue.interpolate({
            inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
            outputRange: ['0 deg', '-5 deg', '3 deg', '-3 deg', '2 deg', '-1 deg', '0 deg'],
          }),
        }],
      });
    }

    _bounce(duration, direction, originOrDestination) {
      let style = {
        opacity: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.55, 1]),
          outputRange: (direction === 'in' ? [0, 1, 1] : [1, 1, 0]),
        }),
      };
      if (originOrDestination) {
        style.transform = createKeyedArray(this._getBounceTransformation(direction, originOrDestination));
      }
      return this.animate(duration, style);
    }

    _getBounceTransformation(direction, originOrDestination) {
      const windowSize = Dimensions.get('window');
      const animationValue = getAnimationValueForDirection(direction, originOrDestination, windowSize.height, windowSize.width);
      const translateKey = (originOrDestination === 'up' || originOrDestination === 'down' ? 'translateY' : 'translateX');
      const modifier = animationValue > 0 ? 1 : -1;

      return {
        [translateKey]: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 0.75, 0.9, 1] : [0, 0.2, 0.4, 0.45, 1]),
          outputRange: (direction === 'in' ? [animationValue, 25 * modifier, -10 * modifier, 5 * modifier, 0] : [0, 10 * modifier, -20 * modifier, -20 * modifier, animationValue]),
        }),
      };
    }

    bounceIn(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
            outputRange: [0.3, 1.1, 0.9, 1.03, 0.97, 1],
          }),
        }],
      });
    }

    bounceOut(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.55, 1],
          outputRange: [1, 1, 0],
        }),
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 0.2, 0.5, 0.55, 1],
            outputRange: [1, 0.9, 1.1, 1.1, 0.3],
          }),
        }],
      });
    }

    bounceInDown(duration) {
      return this._bounce(duration, 'in', 'down');
    }

    bounceInUp(duration) {
      return this._bounce(duration, 'in', 'up');
    }

    bounceInLeft(duration) {
      return this._bounce(duration, 'in', 'left');
    }

    bounceInRight(duration) {
      return this._bounce(duration, 'in', 'right');
    }

    bounceOutDown(duration) {
      return this._bounce(duration, 'out', 'down');
    }

    bounceOutUp(duration) {
      return this._bounce(duration, 'out', 'up');
    }

    bounceOutLeft(duration) {
      return this._bounce(duration, 'out', 'left');
    }

    bounceOutRight(duration) {
      return this._bounce(duration, 'out', 'right');
    }

    flipInX(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [{
          rotateX: this.state.animationValue.interpolate({
            inputRange: [0, 0.4, 0.6, 0.8, 1],
            outputRange: ['90 deg', '-20 deg', '10 deg', '-5 deg', '0 deg'],
          }),
        }],
      });
    }

    flipInY(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [{
          rotateY: this.state.animationValue.interpolate({
            inputRange: [0, 0.4, 0.6, 0.8, 1],
            outputRange: ['90 deg', '-20 deg', '10 deg', '-5 deg', '0 deg'],
          }),
        }],
      });
    }

    flipOutX(duration) {
      return this.animate(duration || 750, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 1, 0],
        }),
        transform: [{
          rotateX: this.state.animationValue.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: ['0 deg', '-20 deg', '90 deg'],
          }),
        }],
      });
    }

    flipOutY(duration) {
      return this.animate(duration || 750, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 1, 0],
        }),
        transform: [{
          rotateY: this.state.animationValue.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: ['0 deg', '-20 deg', '90 deg'],
          }),
        }],
      });
    }

    lightSpeedIn(duration) {
      const width = (this._layout || Dimensions.get('window')).width;
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [width, 0, 0],
          }),
        }, {
          skewX: this.state.animationValue.interpolate({
            inputRange: [0, 0.6, 0.8, 1],
            outputRange: ['-30 deg', '20 deg', '-5 deg', '0 deg'],
          }),
        }],
      });
    }

    lightSpeedOut(duration) {
      const width = (this._layout || Dimensions.get('window')).width;
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        }),
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, width],
          }),
        }, {
          skewX: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0 deg', '30 deg'],
          }),
        }],
      });
    }

    _fade(duration, direction, originOrDestination, isBig) {
      let style = {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: (direction === 'in' ? [0, 1] : [1, 0]),
        }),
      };
      if (originOrDestination) {
        style.transform = createKeyedArray(this._getSlideTransformation(direction, originOrDestination, isBig));
      }
      return this.animate(duration, style);
    }

    fadeIn(duration) {
      return this._fade(duration, 'in');
    }

    fadeInDown(duration) {
      return this._fade(duration, 'in', 'down');
    }

    fadeInUp(duration) {
      return this._fade(duration, 'in', 'up');
    }

    fadeInLeft(duration) {
      return this._fade(duration, 'in', 'left');
    }

    fadeInRight(duration) {
      return this._fade(duration, 'in', 'right');
    }

    fadeOut(duration) {
      return this._fade(duration, 'out');
    }

    fadeOutDown(duration) {
      return this._fade(duration, 'out', 'down');
    }

    fadeOutUp(duration) {
      return this._fade(duration, 'out', 'up');
    }

    fadeOutLeft(duration) {
      return this._fade(duration, 'out', 'left');
    }

    fadeOutRight(duration) {
      return this._fade(duration, 'out', 'right');
    }

    fadeInDownBig(duration) {
      return this._fade(duration, 'in', 'down', true);
    }

    fadeInUpBig(duration) {
      return this._fade(duration, 'in', 'up', true);
    }

    fadeInLeftBig(duration) {
      return this._fade(duration, 'in', 'left', true);
    }

    fadeInRightBig(duration) {
      return this._fade(duration, 'in', 'right', true);
    }

    fadeOutDownBig(duration) {
      return this._fade(duration, 'out', 'down', true);
    }

    fadeOutUpBig(duration) {
      return this._fade(duration, 'out', 'up', true);
    }

    fadeOutLeftBig(duration) {
      return this._fade(duration, 'out', 'left', true);
    }

    fadeOutRightBig(duration) {
      return this._fade(duration, 'out', 'right', true);
    }

    _getSlideTransformation(direction, originOrDestination, isBig) {
      const size = (isBig || !this._layout ? Dimensions.get('window') : this._layout);
      const animationValue = getAnimationValueForDirection(direction, originOrDestination, size.height, size.width);
      const translateKey = (originOrDestination === 'up' || originOrDestination === 'down' ? 'translateY' : 'translateX');

      return {
        [translateKey]: this.state.animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: (direction === 'in' ? [animationValue, 0] : [0, animationValue]),
        }),
      };
    }

    _slide(duration, direction, originOrDestination) {
      return this.animate(duration, {
        transform: createKeyedArray(this._getSlideTransformation(direction, originOrDestination)),
      });
    }

    slideInDown(duration) {
      return this._slide(duration, 'in', 'down');
    }

    slideInUp(duration) {
      return this._slide(duration, 'in', 'up');
    }

    slideInLeft(duration) {
      return this._slide(duration, 'in', 'left');
    }

    slideInRight(duration) {
      return this._slide(duration, 'in', 'right');
    }

    slideOutDown(duration) {
      return this._slide(duration, 'out', 'down');
    }

    slideOutUp(duration) {
      return this._slide(duration, 'out', 'up');
    }

    slideOutLeft(duration) {
      return this._slide(duration, 'out', 'left');
    }

    slideOutRight(duration) {
      return this._slide(duration, 'out', 'right');
    }

    _zoom(duration, direction, originOrDestination) {
      let style = {
        opacity: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.4, 1]),
          outputRange: (direction === 'in' ? [0, 1, 1] : [1, 1, 0]),
        }),
      };
      if (originOrDestination) {
        style.transform = createKeyedArray(this._getZoomTransformation(direction, originOrDestination));
      }
      return this.animate(duration, style);
    }

    _getZoomTransformation(direction, originOrDestination) {
      const windowSize = Dimensions.get('window');
      const animationValue = getAnimationValueForDirection(direction, originOrDestination, windowSize.height, windowSize.width);
      const translateKey = (originOrDestination === 'up' || originOrDestination === 'down' ? 'translateY' : 'translateX');
      const modifier = animationValue > 0 ? 1 : -1;

      return {
        scale: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.4, 1]),
          outputRange: (direction === 'in' ? [0.1, 0.457, 1] : [1, 0.457, 0.1]),
        }),
        [translateKey]: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.4, 1]),
          outputRange: (direction === 'in' ? [animationValue, -60 * modifier, 0] : [0, -60 * modifier, animationValue]),
        }),
      };
    }

    zoomIn(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        }],
      });
    }

    zoomOut(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1, 0],
        }),
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.3, 0],
          }),
        }],
      });
    }

    zoomInDown(duration) {
      return this._zoom(duration, 'in', 'down');
    }

    zoomInUp(duration) {
      return this._zoom(duration, 'in', 'up');
    }

    zoomInLeft(duration) {
      return this._zoom(duration, 'in', 'left');
    }

    zoomInRight(duration) {
      return this._zoom(duration, 'in', 'right');
    }

    zoomOutDown(duration) {
      return this._zoom(duration, 'out', 'down');
    }

    zoomOutUp(duration) {
      return this._zoom(duration, 'out', 'up');
    }

    zoomOutLeft(duration) {
      return this._zoom(duration, 'out', 'left');
    }

    zoomOutRight(duration) {
      return this._zoom(duration, 'out', 'right');
    }

    render() {
      const { style, children, onLayout, animation, duration, delay, transition, ...props } = this.props;
      if (animation && transition) {
        throw new Error('You cannot combine animation and transition props');
      }
      const { scheduledAnimation } = this.state;
      const hideStyle = (scheduledAnimation && scheduledAnimation.indexOf('In') !== -1 ? { opacity: 0 } : false);

      return (
        <Animatable
          {...props}
          ref={element => this._root = element}
          onLayout={event => this._handleLayout(event)}
          style={[
            style,
            this.state.animationStyle,
            wrapStyleTransforms(this.state.transitionStyle),
            hideStyle,
          ]}
          >{children}</Animatable>
        );
    }
  };
}

export const View = createAnimatableComponent(ReactNative.View);
export const Text = createAnimatableComponent(ReactNative.Text);
export const Image = createAnimatableComponent(ReactNative.Image);
