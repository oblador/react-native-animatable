'use strict';

var React = require('react-native');
var {
  StyleSheet,
  PropTypes,
  Animated,
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
  'fontWeight',
];

// Creates an initial animation style and takes care of transform wrapping if neccesary
var getAnimationStyleForTransition = function(transition, styleValue) {
  var animationStyle = {};
  if(transition) {
    animationStyle[transition] = styleValue;
    if(TRANSFORM_STYLE_PROPERTIES.indexOf(transition) !== -1) {
      animationStyle = { transform: [animationStyle] };
    }
  }
  return animationStyle;
};

// Make (almost) any component animatable, similar to Animated.createAnimatedComponent
var createAnimatableComponent = function(component) {
  var Animatable = Animated.createAnimatedComponent(component);
  return React.createClass({
    propTypes: {
      animation:        PropTypes.string,
      transition:       PropTypes.string,
      transitionValue:  PropTypes.any,
      duration:         PropTypes.number,
      delay:            PropTypes.number,
    },

    getInitialState: function() {
      var animationValue, styleValue;
      if(INTERPOLATION_STYLE_PROPERTIES.indexOf(this.props.transition) !== -1) {
        animationValue = new Animated.Value(0);
        styleValue = this.props.transitionValue;
      } else {
        animationValue = styleValue = new Animated.Value(this.props.transitionValue || 0);
      }
      return {
        animationValue: animationValue,
        currentTransitionValue: this.props.transitionValue,
        animationStyle: getAnimationStyleForTransition(this.props.transition, styleValue),
      };
    },

    setNativeProps: function(nativeProps) {
      this._root.setNativeProps(nativeProps);
    },

    componentWillMount: function() {
      var { animation, duration, delay } = this.props;
      if(animation) {
        if(delay) {
          this.setState({ scheduledAnimation: animation });
          this._timer = setTimeout(() =>{
            this[animation](duration);
            this.setState({ scheduledAnimation: false });
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
        this[animation](duration);
      }
    },

    componentWillUnmount: function() {
      if(this._timer) {
        clearTimeout(this._timer);
      }
    },

    componentWillReceiveProps: function(props) {
      var { animation, duration, transition, transitionValue } = props;
      if(transition && transitionValue !== this.props.transitionValue) {
        this.transitionTo(transition, transitionValue, duration || this.props.duration);
      }
      if(animation !== this.props.animation) {
        if(animation) {
          if(this.state.scheduledAnimation) {
            this.setState({ scheduledAnimation: animation });
          } else {
            this[animation](duration);
          }
        } else {
          this.setState({
            scheduledAnimation: false,
            animationStyle: {},
          });
          if(this._timer) {
            clearTimeout(this._timer);
            this._timer = false;
          }
        }
      }
    },

    _handleLayout: function(event) {
      var { duration, onLayout } = this.props;
      var { scheduledAnimation } = this.state;

      this._layout = event.nativeEvent.layout;
      if(onLayout) {
        onLayout(event);
      }

      if(scheduledAnimation) {
        this.setState({ scheduledAnimation: false });
        this[scheduledAnimation](duration);
      }
    },

    animate: function(duration, animationStyle) {
      var { animationValue } = this.state;
      animationValue.setValue(0);
      this.setState({ animationStyle }, function() {
        Animated.timing(animationValue, {
          toValue: 1,
          duration: duration || this.props.duration || 1000
        }).start();
      });
    },

    transition: function(property, fromValue, toValue, duration) {
      var { animationValue, currentTransitionValue } = this.state;
      var styleValue = animationValue;
      if(INTERPOLATION_STYLE_PROPERTIES.indexOf(this.props.transition) !== -1) {
        animationValue.setValue(0);
        styleValue = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [currentTransitionValue, toValue],
        });
        currentTransitionValue = toValue;
        toValue = 1;
      } else {
        animationValue.setValue(fromValue);
      }
      var animationStyle = getAnimationStyleForTransition(property, styleValue);
      this.setState({ animationStyle, currentTransitionValue }, function() {
        this._transitionToValue(toValue, duration || this.props.duration);
      });
    },

    transitionTo: function(property, toValue, duration) {
      if(INTERPOLATION_STYLE_PROPERTIES.indexOf(this.props.transition) !== -1 && typeof this.state.currentTransitionValue !== 'undefined') {
        this.transition(property, this.state.currentTransitionValue, toValue, duration);
      } else if(this.state.animationStyle[property] === this.state.animationValue) {
        this._transitionToValue(toValue, duration);
      } else {
        if(!StyleSheet.flatten) {
          throw new Error('StyleSheet.flatten not available, upgrade React Native or polyfill with StyleSheet.flatten = require(\'flattenStyle\');')
        }
        var style = this.props.style ? StyleSheet.flatten(this.props.style) : {};
        this.transition(property, style[property] || 0, toValue, duration);
      }
    },

    _transitionToValue: function(toValue, duration) {
      var { animationValue } = this.state;
      if(duration) {
        Animated.timing(animationValue, {
          toValue: toValue,
          duration: duration
        }).start();
      } else {
        Animated.spring(animationValue, {
          toValue: toValue,
          duration: duration
        }).start();
      }
    },

    bounce: function(duration) {
      this.animate(duration, {
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
      this.animate(duration, {
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

      this.animate(duration, {
        transform: [{
          skewX: this.state.animationValue.interpolate({ inputRange, outputRange })
        }, {
          skewY: this.state.animationValue.interpolate({ inputRange, outputRange })
        }]
      });
    },

    pulse: function(duration) {
      this.animate(duration, {
        transform: [{
          scale: this.state.animationValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.05, 1],
          }),
        }],
      });
    },

    rubberBand: function(duration) {
      this.animate(duration, {
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
      this.animate(duration, {
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange, outputRange
          }),
        }],
      });
    },

    swing: function(duration) {
      this.animate(duration, {
        transform: [{
          rotateZ: this.state.animationValue.interpolate({
            inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
            outputRange: ['0 deg', '15 deg', '-10 deg', '5 deg', '-5 deg', '0 deg'],
          }),
        }],
      });
    },

    tada: function(duration) {
      this.animate(duration, {
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
      this.animate(duration, {
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
      this.animate(duration, style);
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
      this.animate(duration, {
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
      this.animate(duration, {
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
      this._bounce(duration, 'in', 'down');
    },

    bounceInUp: function(duration) {
      this._bounce(duration, 'in', 'up');
    },

    bounceInLeft: function(duration) {
      this._bounce(duration, 'in', 'left');
    },

    bounceInRight: function(duration) {
      this._bounce(duration, 'in', 'right');
    },

    bounceOutDown: function(duration) {
      this._bounce(duration, 'out', 'down');
    },

    bounceOutUp: function(duration) {
      this._bounce(duration, 'out', 'up');
    },

    bounceOutLeft: function(duration) {
      this._bounce(duration, 'out', 'left');
    },

    bounceOutRight: function(duration) {
      this._bounce(duration, 'out', 'right');
    },

    flipInX: function(duration) {
      this.animate(duration, {
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
      this.animate(duration, {
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
      this.animate(duration || 750, {
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
      this.animate(duration || 750, {
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
      this.animate(duration, {
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
      this.animate(duration, {
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
      this.animate(duration, style);
    },

    fadeIn: function(duration) {
      this._fade(duration, 'in');
    },

    fadeInDown: function(duration) {
      this._fade(duration, 'in', 'down');
    },

    fadeInUp: function(duration) {
      this._fade(duration, 'in', 'up');
    },

    fadeInLeft: function(duration) {
      this._fade(duration, 'in', 'left');
    },

    fadeInRight: function(duration) {
      this._fade(duration, 'in', 'right');
    },

    fadeOut: function(duration) {
      this._fade(duration, 'out');
    },

    fadeOutDown: function(duration) {
      this._fade(duration, 'out', 'down');
    },

    fadeOutUp: function(duration) {
      this._fade(duration, 'out', 'up');
    },

    fadeOutLeft: function(duration) {
      this._fade(duration, 'out', 'left');
    },

    fadeOutRight: function(duration) {
      this._fade(duration, 'out', 'right');
    },

    fadeInDownBig: function(duration) {
      this._fade(duration, 'in', 'down', true);
    },

    fadeInUpBig: function(duration) {
      this._fade(duration, 'in', 'up', true);
    },

    fadeInLeftBig: function(duration) {
      this._fade(duration, 'in', 'left', true);
    },

    fadeInRightBig: function(duration) {
      this._fade(duration, 'in', 'right', true);
    },

    fadeOutDownBig: function(duration) {
      this._fade(duration, 'out', 'down', true);
    },

    fadeOutUpBig: function(duration) {
      this._fade(duration, 'out', 'up', true);
    },

    fadeOutLeftBig: function(duration) {
      this._fade(duration, 'out', 'left', true);
    },

    fadeOutRightBig: function(duration) {
      this._fade(duration, 'out', 'right', true);
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
      this.animate(duration, {
        transform: createKeyedArray(this._getSlideTransformation(direction, originOrDestination)),
      });
    },

    slideInDown: function(duration) {
      this._slide(duration, 'in', 'down');
    },

    slideInUp: function(duration) {
      this._slide(duration, 'in', 'up');
    },

    slideInLeft: function(duration) {
      this._slide(duration, 'in', 'left');
    },

    slideInRight: function(duration) {
      this._slide(duration, 'in', 'right');
    },

    slideOutDown: function(duration) {
      this._slide(duration, 'out', 'down');
    },

    slideOutUp: function(duration) {
      this._slide(duration, 'out', 'up');
    },

    slideOutLeft: function(duration) {
      this._slide(duration, 'out', 'left');
    },

    slideOutRight: function(duration) {
      this._slide(duration, 'out', 'right');
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
      this.animate(duration, style);
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
      this.animate(duration, {
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
      this.animate(duration, {
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
      this._zoom(duration, 'in', 'down');
    },

    zoomInUp: function(duration) {
      this._zoom(duration, 'in', 'up');
    },

    zoomInLeft: function(duration) {
      this._zoom(duration, 'in', 'left');
    },

    zoomInRight: function(duration) {
      this._zoom(duration, 'in', 'right');
    },

    zoomOutDown: function(duration) {
      this._zoom(duration, 'out', 'down');
    },

    zoomOutUp: function(duration) {
      this._zoom(duration, 'out', 'up');
    },

    zoomOutLeft: function(duration) {
      this._zoom(duration, 'out', 'left');
    },

    zoomOutRight: function(duration) {
      this._zoom(duration, 'out', 'right');
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
        style={[style, this.state.animationStyle, hideStyle]}
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
