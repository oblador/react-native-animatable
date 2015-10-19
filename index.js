'use strict';

var React = require('react-native');
var { View, Text, Image, Animated } = React;

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

var createAnimatableComponent = function(component) {
  var Animatable = Animated.createAnimatedComponent(component);
  return React.createClass({
    getInitialState: function() {
      return {
        animationValue: new Animated.Value(0),
        animationStyle: {},
      };
    },

    animate: function(duration, animationStyle) {
      var { animationValue } = this.state;
      animationValue.setValue(0);
      this.setState({ animationStyle }, function() {
        Animated.timing(animationValue, {
          toValue: 1,
          duration: duration || 1000
        }).start();
      });
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
      var { style, children, onLayout, ...props } = this.props;
      return (<Animatable
        onLayout={event => {
          this._layout = event.nativeEvent.layout;
          if(onLayout) {
            onLayout(event);
          }
        }}
        style={[this.state.animationStyle, style]}
        {...props}>{children}</Animatable>);
    }
  });
};

module.exports = {
  createAnimatableComponent,
  View: createAnimatableComponent(View),
  Text: createAnimatableComponent(Text),
  Image: createAnimatableComponent(Image),
};
