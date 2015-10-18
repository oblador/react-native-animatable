'use strict';

var React = require('react-native');
var { View, Text, Image, Animated } = React;

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
          duration
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
      this.animate(duration, {
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
      this.animate(duration, {
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

    _slide: function(duration, direction, originOrDestination) {
      var animationValue;
      switch(originOrDestination) {
        case 'up':    animationValue = this.layout.height; break;
        case 'down':  animationValue = -this.layout.height; break;
        case 'left':  animationValue = -this.layout.width; break;
        case 'right': animationValue = this.layout.width; break;
      }

      var translateKey = (originOrDestination === 'up' || originOrDestination === 'down' ? 'translateY' : 'translateX');
      if(translateKey === 'translateY' && direction === 'out') {
        animationValue = -animationValue;
      }

      var transformation = {};
      transformation[translateKey] = this.state.animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: (direction === 'in' ? [animationValue, 0] : [0, animationValue]),
      });

      this.animate(duration, {
        transform: [transformation],
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

    render: function() {
      var { style, children, onLayout, ...props } = this.props;
      return (<Animatable
        onLayout={event => {
          this.layout = event.nativeEvent.layout;
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
