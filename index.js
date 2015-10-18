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

    slideInDown: function(duration) {
      this.animate(duration, {
        transform: [{
          translateY: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-this.layout.height, 0],
          }),
        }],
      });
    },

    slideInUp: function(duration) {
      this.animate(duration, {
        transform: [{
          translateY: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [this.layout.height, 0],
          }),
        }],
      });
    },

    slideInLeft: function(duration) {
      this.animate(duration, {
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-this.layout.width, 0],
          }),
        }],
      });
    },

    slideInRight: function(duration) {
      this.animate(duration, {
        transform: [{
          translateX: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [this.layout.width, 0],
          }),
        }],
      });
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
