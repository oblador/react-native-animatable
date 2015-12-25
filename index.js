'use strict';

var React = require('react-native');
var {
  StyleSheet,
  PropTypes,
  Animated,
  Easing,
  Dimensions,
  View,
  Text,
  Image,
} = React;

// Transform an object to an array the way react native wants it for transform styles
// { a: x, b: y } => [{ a: x }, { b: y }]
var createKeyedArray = function(obj) {
  return Object.keys(obj).map(function(key) {
    var keyed = {};
    keyed[key] = obj[key];
    return keyed;
  });
};

// Helper function to calculate transform values, args:
// direction: in|out
// originOrDestination: up|down|left|right
// verticalValue: amplitude for up/down animations
// horizontalValue: amplitude for left/right animations
var getAnimationValueForDirection = function(direction, originOrDestination, verticalValue, horizontalValue) {
  var isVertical = originOrDestination === 'up' || originOrDestination === 'down';
  var modifier = (isVertical && direction === 'out' ? -1 : 1) * (originOrDestination === 'down' || originOrDestination === 'left' ? -1 : 1);
  return modifier * (isVertical ? verticalValue : horizontalValue);
};

// Animations starting with these keywords use element dimensions
// thus, any animation needs to be deferred until the element is measured
var LAYOUT_DEPENDENT_ANIMATIONS = [
  'slide',
  'fade',
  'wobble',
  'lightSpeed'
];

// These styles need to be nested in a transform array
var TRANSFORM_STYLE_PROPERTIES = [
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
var INTERPOLATION_STYLE_PROPERTIES = [
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

var EASING_FUNCTIONS = {
  'linear':      Easing.linear,
  'ease':        Easing.ease,
  'ease-in':     Easing.in(Easing.ease),
  'ease-out':    Easing.out(Easing.ease),
  'ease-in-out': Easing.inOut(Easing.ease),
};

// Transforms { translateX: 1 } to { transform: [{ translateX: 1 }]}
var wrapStyleTransforms = function(style) {
  var wrapped = {};
  Object.keys(style).forEach(function(key) {
    if(TRANSFORM_STYLE_PROPERTIES.indexOf(key) !== -1) {
      if(!wrapped.transform) {
        wrapped.transform = [];
      }
      var transform = {};
      transform[key] = style[key];
      wrapped.transform.push(transform);
    } else {
      wrapped[key] = style[key];
    }
  });
  return wrapped;
};

// Determine to what value the animation should tween to
var getAnimationTarget = function(iteration, direction) {
  switch(direction) {
    case 'reverse': return 0;
    case 'alternate': return (iteration % 2) ? 0 : 1;
    case 'alternate-reverse': return (iteration % 2) ? 1 : 0;
    case 'normal':
    default: return 1;
  }
};

// Like getAnimationTarget but opposite
var getAnimationOrigin = function(iteration, direction) {
  return getAnimationTarget(iteration, direction) ? 0 : 1;
};

var getDefaultStyleValue = function(key) {
  if(key === 'backgroundColor') {
    return 'rgba(0,0,0,0)';
  }
  if(key === 'color' || key.indexOf('Color') !== -1) {
    return 'rgba(0,0,0,1)';
  }
  if(key.indexOf('rotate') !== -1 || key.indexOf('skew') !== -1) {
    return '0deg';
  }
  if(key === 'fontSize') {
    return 14;
  }
  if(key === 'opacity') {
    return 1;
  }
  return 0;
};

// Returns a flattened version of style with only `keys` values.
var getStyleValues = function(keys, style) {
  if(!StyleSheet.flatten) {
    throw new Error('StyleSheet.flatten not available, upgrade React Native or polyfill with StyleSheet.flatten = require(\'flattenStyle\');')
  }
  var values = {};
  var style = Object.assign({}, StyleSheet.flatten(style));
  if(style.transform) {
    style.transform.forEach(function(transform) {
      var key = Object.keys(transform)[0];
      style[key] = transform[key];
    });
    delete style.transform;
  }
  if(typeof keys === 'string') {
    keys = [keys];
  }
  keys.forEach(function(key) {
    values[key] = (key in style ? style[key] : getDefaultStyleValue(key));
  });
  return values;
};

// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
var createAnimatableComponent = function(component) {
  var Animatable = Animated.createAnimatedComponent(component);
  return React.createClass({
    propTypes: {
      animation:        PropTypes.string,
      onAnimationEnd:   PropTypes.func,
      transition:       PropTypes.oneOfType([
                          PropTypes.string,
                          PropTypes.arrayOf(PropTypes.string),
                        ]),
      transitionValue:  PropTypes.any, // Deprecated
      duration:         PropTypes.number,
      direction:        PropTypes.oneOf(['normal', 'reverse', 'alternate', 'alternate-reverse']),
      delay:            PropTypes.number,
      easing:           PropTypes.oneOf(Object.keys(EASING_FUNCTIONS)),
      iterationCount:   function(props, propName, componentName) {
        var val = props[propName];
        if(val !== 'infinite' && !(typeof val === 'number' && val >= 1)) {
          return new Error('iterationCount must be a positive number or "infinite"');
        }
      },
    },

    getDefaultProps: function() {
      return {
        iterationCount: 1,
        onAnimationEnd: function() {},
      }
    },

    getInitialState: function() {
      var transitionValues = {};
      var styleValues = {};
      var currentTransitionValues;

      if(this.props.transition) {
        var style = this.props.style;
        if(this.props.transitionValue !== undefined) {
          console.warn('transitionValue is deprecated, use regular style prop instead.');
          var transitionStyle = {};
          transitionStyle[this.props.transition] = this.props.transitionValue;
          style = [style, transitionStyle];
        }
        var currentTransitionValues = getStyleValues(this.props.transition, style);
        Object.keys(currentTransitionValues).forEach(key => {
          var value = currentTransitionValues[key];
          if(INTERPOLATION_STYLE_PROPERTIES.indexOf(key) !== -1) {
            transitionValues[key] = new Animated.Value(0);
            styleValues[key] = value;
          } else {
            transitionValues[key] = styleValues[key] = new Animated.Value(value);
          }
        })
      }
      return {
        animationValue: new Animated.Value(getAnimationOrigin(0, this.props.direction)),
        animationStyle: {},
        transitionStyle: styleValues,
        transitionValues: transitionValues,
        currentTransitionValues: currentTransitionValues,
      };
    },

    setNativeProps: function(nativeProps) {
      this._root.setNativeProps(nativeProps);
    },

    componentDidMount: function() {
      var { animation, duration, delay, onAnimationEnd } = this.props;
      if(animation) {
        if(delay) {
          this.setState({ scheduledAnimation: animation });
          this._timer = setTimeout(() =>{
            this.setState({ scheduledAnimation: false }, () => this[animation](duration).then(onAnimationEnd));
            this._timer = false;
          }, delay);
          return;
        }
        for (var i = LAYOUT_DEPENDENT_ANIMATIONS.length - 1; i >= 0; i--) {
          if(animation.indexOf(LAYOUT_DEPENDENT_ANIMATIONS[i]) === 0) {
            this.setState({ scheduledAnimation: animation });
            return;
          }
        };
        this[animation](duration).then(onAnimationEnd);
      }
    },

    componentWillUnmount: function() {
      if(this._timer) {
        clearTimeout(this._timer);
      }
    },

    componentWillReceiveProps: function(props) {
      var { animation, duration, easing, transition, transitionValue, onAnimationEnd } = props;

      if(transition) {
        var transitionValues = {};
        var style = props.style;
        if(transitionValue !== undefined) {
          var transitionStyle = {};
          transitionStyle[transition] = transitionValue;
          style = [style, transitionStyle];
        }
        var values = getStyleValues(transition, style);
        this.transitionTo(values, duration, easing);
      } else if(animation !== this.props.animation) {
        if(animation) {
          if(this.state.scheduledAnimation) {
            this.setState({ scheduledAnimation: animation });
          } else {
            this[animation](duration).then(onAnimationEnd);
          }
        } else {
          this.stopAnimation();
        }
      }
    },

    _handleLayout: function(event) {
      var { duration, onLayout, onAnimationEnd } = this.props;
      var { scheduledAnimation } = this.state;

      this._layout = event.nativeEvent.layout;
      if(onLayout) {
        onLayout(event);
      }

      if(scheduledAnimation && !this._timer) {
        this.setState({ scheduledAnimation: false }, () => {
          this[scheduledAnimation](duration).then(onAnimationEnd);
        });
      }
    },

    animate: function(duration, animationStyle) {
      return new Promise((resolve, reject) => {
        this.setState({
          animationStyle
        }, () => this._startAnimation(duration, 0, endState => {
          if(endState.finished) {
            resolve();
          } else {
            reject();
          }
        }));
      });
    },

    stopAnimation: function() {
      this.setState({
        scheduledAnimation: false,
        animationStyle: {},
      });
      this.state.animationValue.stopAnimation();
      if(this._timer) {
        clearTimeout(this._timer);
        this._timer = false;
      }
    },

    _startAnimation: function(duration, iteration, callback) {
      var { animationValue } = this.state;
      var { direction, easing, iterationCount } = this.props;
      easing = easing || 'ease-in-out';
      iteration = iteration || 0;
      var fromValue = getAnimationOrigin(iteration, direction);
      var toValue = getAnimationTarget(iteration, direction);
      animationValue.setValue(fromValue);

      // This is on the way back reverse
      if((
          (direction === 'reverse') ||
          (direction === 'alternate' && !toValue) ||
          (direction === 'alternate-reverse' && !toValue)
        ) && easing.match(/^ease\-(in|out)$/)) {
        if(easing.indexOf('-in') !== -1) {
          easing = easing.replace('-in', '-out');
        } else {
          easing = easing.replace('-out', '-in');
        }
      }
      Animated.timing(animationValue, {
        toValue: toValue,
        easing: EASING_FUNCTIONS[easing],
        isInteraction: !iterationCount,
        duration: duration || this.props.duration || 1000
      }).start(endState => {
        iteration++;
        if(endState.finished && this.props.animation && (iterationCount === 'infinite' || iteration < iterationCount)) {
          this._startAnimation(duration, iteration);
        } else if(callback) {
          callback(endState);
        }
      });
    },

    transition: function(fromValues, toValues, duration, easing) {
      // Backwards support w arguments (property, fromValue, toValue, duration, easing)
      if(arguments.length > 4) {
        var property = arguments[0];
        fromValues = {};
        toValues = {};
        fromValues[property] = arguments[1];
        toValues[property] = arguments[2];
        return this.transition(fromValues, toValues, arguments[3], arguments[4]);
      }

      var { transitionValues, currentTransitionValues, transitionStyle } = this.state;
      Object.keys(toValues).forEach(property => {
        var fromValue = fromValues[property];
        var toValue = toValues[property];
        var transitionValue = transitionValues[property];
        if(!transitionValue) {
          transitionValue = new Animated.Value(0);
        }
        transitionStyle[property] = transitionValue;

        if(INTERPOLATION_STYLE_PROPERTIES.indexOf(property) !== -1) {
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
      this.setState({ transitionValues, transitionStyle, currentTransitionValues }, function() {
        this._transitionToValues(toValues, duration || this.props.duration, easing);
      });
    },

    transitionTo: function(toValues, duration, easing) {
      // Backwards support w arguments (property, toValue, duration, easing)
      if(arguments.length > 3) {
        var property = arguments[0];
        toValues = {};
        toValues[property] = arguments[1];
        return this.transitionTo(toValues, arguments[2], arguments[3]);
      }

      var { currentTransitionValues } = this.state;

      var transitions = {
        from: {},
        to: {},
      };

      Object.keys(toValues).forEach(property => {
        var toValue = toValues[property];

        if(INTERPOLATION_STYLE_PROPERTIES.indexOf(property) === -1 && this.state.transitionStyle[property] === this.state.transitionValues[property]) {
          return this._transitionToValue(this.state.transitionValues[property], toValue, duration, easing);
        }

        var currentTransitionValue = currentTransitionValues[property];
        if(typeof currentTransitionValue === 'undefined' && this.props.style) {
          var style = getStyleValues(property, this.props.style);
          currentTransitionValue = style[property];
        }
        transitions.from[property] = currentTransitionValue;
        transitions.to[property] = toValue;
      });

      if(Object.keys(transitions.from).length) {
        this.transition(transitions.from, transitions.to, duration, easing);
      }
    },

    _transitionToValues: function(toValues, duration, easing) {
      Object.keys(toValues).forEach(property => {
        var transitionValue = this.state.transitionValues[property];
        var toValue = toValues[property];
        this._transitionToValue(transitionValue, toValue, duration, easing);
      });
    },

    _transitionToValue: function(transitionValue, toValue, duration, easing) {
      if(duration || easing) {
        Animated.timing(transitionValue, {
          toValue: toValue,
          duration: duration || 1000,
          easing: EASING_FUNCTIONS[easing || 'ease-in-out']
        }).start();
      } else {
        Animated.spring(transitionValue, {
          toValue: toValue,
        }).start();
      }
    },

    bounce: function(duration) {
      return this.animate(duration, {
        transform: [{
          translateY: this.state.animationValue.interpolate({
            inputRange: [0, 0.2, 0.4, 0.43, 0.53, 0.7, 0.8, 0.9, 1],
            outputRange: [0, 0, -30, -30, 0, -15, 0, -4, 0],
          }),
        }],
      });
    },

    flash: function(duration, times) {
      var inputRange = [0];
      var outputRange = [1];
      times = Math.abs(times || 2) * 2;
      for(var i = 1; i <= times; i++) {
        inputRange.push(i/times);
        outputRange.push(i % 2 ? 0 : 1);
      }
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange, outputRange
        }),
      });
    },

    jello: function(duration, skew, times) {
      var inputRange = [0];
      var outputRange = ['0 deg'];
      skew = skew || 12.5;
      times = Math.abs(times || 4) * 2;
      for(var i = 1; i < times; i++) {
        inputRange.push(i/times);
        outputRange.push(skew / i * (i % 2 ? -1 : 1) + ' deg');
      }
      inputRange.push(1);
      outputRange.push('0 deg');

      return this.animate(duration, {
        transform: [{
          skewX: this.state.animationValue.interpolate({ inputRange, outputRange })
        }, {
          skewY: this.state.animationValue.interpolate({ inputRange, outputRange })
        }]
      });
    },

    pulse: function(duration) {
      return this.animate(duration, {
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1],
          }),
        }],
      });
    },

    rubberBand: function(duration) {
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
    },

    shake: function(duration, distance, times) {
      var inputRange = [0];
      var outputRange = [0];
      distance = Math.abs(distance || 10);
      times = Math.abs(times || 5);
      for(var i = 1; i <= times; i++) {
        inputRange.push(i/times);
        outputRange.push(i === times ? 0 : (i%2 ? 1 : -1) * distance);
      }
      return this.animate(duration, {
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange, outputRange
          }),
        }],
      });
    },

    swing: function(duration) {
      return this.animate(duration, {
        transform: [{
          rotateZ: this.state.animationValue.interpolate({
            inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
            outputRange: ['0 deg', '15 deg', '-10 deg', '5 deg', '-5 deg', '0 deg'],
          }),
        }],
      });
    },

    tada: function(duration) {
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
    },

    wobble: function(duration) {
      var width = this._layout.width;
      return this.animate(duration, {
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
            outputRange: [0, -0.25*width, 0.2*width, -0.15*width, 0.1*width, -0.05*width, 1],
          }),
        }, {
          rotateZ: this.state.animationValue.interpolate({
            inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
            outputRange: ['0 deg', '-5 deg', '3 deg', '-3 deg', '2 deg', '-1 deg', '0 deg'],
          }),
        }],
      });
    },

    _bounce: function(duration, direction, originOrDestination) {
      var style = {
        opacity: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.55, 1]),
          outputRange: (direction === 'in' ? [0, 1, 1] : [1, 1, 0]),
        }),
      };
      if(originOrDestination) {
        style.transform = createKeyedArray(this._getBounceTransformation(direction, originOrDestination));
      }
      return this.animate(duration, style);
    },

    _getBounceTransformation: function(direction, originOrDestination) {
      var windowSize = Dimensions.get('window');
      var animationValue = getAnimationValueForDirection(direction, originOrDestination, windowSize.height, windowSize.width);
      var translateKey = (originOrDestination === 'up' || originOrDestination === 'down' ? 'translateY' : 'translateX');
      var modifier = animationValue > 0 ? 1 : -1;

      var transformation = {};
      transformation[translateKey] = this.state.animationValue.interpolate({
        inputRange: (direction === 'in' ? [0, 0.6, 0.75, 0.9, 1] : [0, 0.2, 0.4, 0.45, 1]),
        outputRange: (direction === 'in' ? [animationValue, 25 * modifier, -10 * modifier, 5 * modifier, 0] : [0, 10 * modifier, -20 * modifier, -20 * modifier, animationValue])
      });
      return transformation;
    },

    bounceIn: function(duration) {
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
    },

    bounceOut: function(duration) {
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
    },

    bounceInDown: function(duration) {
      return this._bounce(duration, 'in', 'down');
    },

    bounceInUp: function(duration) {
      return this._bounce(duration, 'in', 'up');
    },

    bounceInLeft: function(duration) {
      return this._bounce(duration, 'in', 'left');
    },

    bounceInRight: function(duration) {
      return this._bounce(duration, 'in', 'right');
    },

    bounceOutDown: function(duration) {
      return this._bounce(duration, 'out', 'down');
    },

    bounceOutUp: function(duration) {
      return this._bounce(duration, 'out', 'up');
    },

    bounceOutLeft: function(duration) {
      return this._bounce(duration, 'out', 'left');
    },

    bounceOutRight: function(duration) {
      return this._bounce(duration, 'out', 'right');
    },

    flipInX: function(duration) {
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
    },

    flipInY: function(duration) {
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
    },

    flipOutX: function(duration) {
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
    },

    flipOutY: function(duration) {
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
    },

    lightSpeedIn: function(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [this._layout.width, 0, 0],
          }),
        }, {
          skewX: this.state.animationValue.interpolate({
            inputRange: [0, 0.6, 0.8, 1],
            outputRange: ['-30 deg', '20 deg', '-5 deg', '0 deg'],
          }),
        }],
      });
    },

    lightSpeedOut: function(duration) {
      return this.animate(duration, {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        }),
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, this._layout.width],
          }),
        }, {
          skewX: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0 deg', '30 deg'],
          }),
        }],
      });
    },

    _fade: function(duration, direction, originOrDestination, isBig) {
      var style = {
        opacity: this.state.animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: (direction === 'in' ? [0, 1] : [1, 0]),
        }),
      };
      if(originOrDestination) {
        style.transform = createKeyedArray(this._getSlideTransformation(direction, originOrDestination, isBig));
      }
      return this.animate(duration, style);
    },

    fadeIn: function(duration) {
      return this._fade(duration, 'in');
    },

    fadeInDown: function(duration) {
      return this._fade(duration, 'in', 'down');
    },

    fadeInUp: function(duration) {
      return this._fade(duration, 'in', 'up');
    },

    fadeInLeft: function(duration) {
      return this._fade(duration, 'in', 'left');
    },

    fadeInRight: function(duration) {
      return this._fade(duration, 'in', 'right');
    },

    fadeOut: function(duration) {
      return this._fade(duration, 'out');
    },

    fadeOutDown: function(duration) {
      return this._fade(duration, 'out', 'down');
    },

    fadeOutUp: function(duration) {
      return this._fade(duration, 'out', 'up');
    },

    fadeOutLeft: function(duration) {
      return this._fade(duration, 'out', 'left');
    },

    fadeOutRight: function(duration) {
      return this._fade(duration, 'out', 'right');
    },

    fadeInDownBig: function(duration) {
      return this._fade(duration, 'in', 'down', true);
    },

    fadeInUpBig: function(duration) {
      return this._fade(duration, 'in', 'up', true);
    },

    fadeInLeftBig: function(duration) {
      return this._fade(duration, 'in', 'left', true);
    },

    fadeInRightBig: function(duration) {
      return this._fade(duration, 'in', 'right', true);
    },

    fadeOutDownBig: function(duration) {
      return this._fade(duration, 'out', 'down', true);
    },

    fadeOutUpBig: function(duration) {
      return this._fade(duration, 'out', 'up', true);
    },

    fadeOutLeftBig: function(duration) {
      return this._fade(duration, 'out', 'left', true);
    },

    fadeOutRightBig: function(duration) {
      return this._fade(duration, 'out', 'right', true);
    },

    _getSlideTransformation: function(direction, originOrDestination, isBig) {
      var size = (isBig ? Dimensions.get('window') : this._layout);
      var animationValue = getAnimationValueForDirection(direction, originOrDestination, size.height, size.width);
      var translateKey = (originOrDestination === 'up' || originOrDestination === 'down' ? 'translateY' : 'translateX');

      var transformation = {};
      transformation[translateKey] = this.state.animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: (direction === 'in' ? [animationValue, 0] : [0, animationValue]),
      });
      return transformation;
    },

    _slide: function(duration, direction, originOrDestination) {
      return this.animate(duration, {
        transform: createKeyedArray(this._getSlideTransformation(direction, originOrDestination)),
      });
    },

    slideInDown: function(duration) {
      return this._slide(duration, 'in', 'down');
    },

    slideInUp: function(duration) {
      return this._slide(duration, 'in', 'up');
    },

    slideInLeft: function(duration) {
      return this._slide(duration, 'in', 'left');
    },

    slideInRight: function(duration) {
      return this._slide(duration, 'in', 'right');
    },

    slideOutDown: function(duration) {
      return this._slide(duration, 'out', 'down');
    },

    slideOutUp: function(duration) {
      return this._slide(duration, 'out', 'up');
    },

    slideOutLeft: function(duration) {
      return this._slide(duration, 'out', 'left');
    },

    slideOutRight: function(duration) {
      return this._slide(duration, 'out', 'right');
    },

    _zoom: function(duration, direction, originOrDestination) {
      var style = {
        opacity: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.4, 1]),
          outputRange: (direction === 'in' ? [0, 1, 1] : [1, 1, 0]),
        }),
      };
      if(originOrDestination) {
        style.transform = createKeyedArray(this._getZoomTransformation(direction, originOrDestination));
      }
      return this.animate(duration, style);
    },

    _getZoomTransformation: function(direction, originOrDestination) {
      var windowSize = Dimensions.get('window');
      var animationValue = getAnimationValueForDirection(direction, originOrDestination, windowSize.height, windowSize.width);
      var translateKey = (originOrDestination === 'up' || originOrDestination === 'down' ? 'translateY' : 'translateX');
      var modifier = animationValue > 0 ? 1 : -1;

      var transformation = {
        scale: this.state.animationValue.interpolate({
          inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.4, 1]),
          outputRange: (direction === 'in' ? [0.1, 0.457, 1] : [1, 0.457, 0.1])
        }),
      };
      transformation[translateKey] = this.state.animationValue.interpolate({
        inputRange: (direction === 'in' ? [0, 0.6, 1] : [0, 0.4, 1]),
        outputRange: (direction === 'in' ? [animationValue, -60 * modifier, 0] : [0, -60 * modifier, animationValue])
      });
      return transformation;
    },

    zoomIn: function(duration) {
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
    },

    zoomOut: function(duration) {
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
    },

    zoomInDown: function(duration) {
      return this._zoom(duration, 'in', 'down');
    },

    zoomInUp: function(duration) {
      return this._zoom(duration, 'in', 'up');
    },

    zoomInLeft: function(duration) {
      return this._zoom(duration, 'in', 'left');
    },

    zoomInRight: function(duration) {
      return this._zoom(duration, 'in', 'right');
    },

    zoomOutDown: function(duration) {
      return this._zoom(duration, 'out', 'down');
    },

    zoomOutUp: function(duration) {
      return this._zoom(duration, 'out', 'up');
    },

    zoomOutLeft: function(duration) {
      return this._zoom(duration, 'out', 'left');
    },

    zoomOutRight: function(duration) {
      return this._zoom(duration, 'out', 'right');
    },

    render: function() {
      var { style, children, onLayout, animation, duration, delay, transition, transitionValue, ...props } = this.props;
      if(animation && transition) {
        throw new Error('You cannot combine animation and transition props');
      }
      var { scheduledAnimation } = this.state;
      var hideStyle = (scheduledAnimation && scheduledAnimation.indexOf('In') !== -1 ? { opacity: 0 } : false)
      return (<Animatable
        {...props}
        ref={(component) => this._root = component}
        onLayout={this._handleLayout}
        style={[
          style,
          this.state.animationStyle,
          wrapStyleTransforms(this.state.transitionStyle),
          hideStyle
        ]}
        >{children}</Animatable>);
    }
  });
};

module.exports = {
  createAnimatableComponent,
  View: createAnimatableComponent(View),
  Text: createAnimatableComponent(Text),
  Image: createAnimatableComponent(Image),
};
