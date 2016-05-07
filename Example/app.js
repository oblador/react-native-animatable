import React, { Component } from 'react';
import ReactNative, {
  StyleSheet,
  Platform,
  Slider,
  TouchableWithoutFeedback,
  PixelRatio,
} from 'react-native';

import { createAnimatableComponent, View, Text } from 'react-native-animatable';
import Accordion from 'react-native-collapsible/Accordion';
const ScrollView = createAnimatableComponent(ReactNative.ScrollView);

const COLORS = [
   '#65b237', // green
   '#346ca5', // blue
   '#a0a0a0', // light grey
   '#ffc508', // yellow
   '#217983', // cobolt
   '#435056', // grey
   '#b23751', // red
   '#333333', // dark
   '#ff6821', // orange
   '#e3a09e', // pink
   '#1abc9c', // turquoise
   '#302614', // brown
];

const ANIMATION_TYPES = {
  'Attention Seekers': [
    'bounce',
    'flash',
    'jello',
    'pulse',
    'rubberBand',
    'shake',
    'swing',
    'tada',
    'wobble',
  ],
  'Bouncing Entrances': [
    'bounceIn',
    'bounceInDown',
    'bounceInUp',
    'bounceInLeft',
    'bounceInRight',
  ],
  'Bouncing Exits': [
    'bounceOut',
    'bounceOutDown',
    'bounceOutUp',
    'bounceOutLeft',
    'bounceOutRight',
  ],
  'Fading Entrances': [
    'fadeIn',
    'fadeInDown',
    'fadeInDownBig',
    'fadeInUp',
    'fadeInUpBig',
    'fadeInLeft',
    'fadeInLeftBig',
    'fadeInRight',
    'fadeInRightBig',
  ],
  'Fading Exits': [
    'fadeOut',
    'fadeOutDown',
    'fadeOutDownBig',
    'fadeOutUp',
    'fadeOutUpBig',
    'fadeOutLeft',
    'fadeOutLeftBig',
    'fadeOutRight',
    'fadeOutRightBig',
  ],
  'Flippers': [
    'flipInX',
    'flipInY',
    'flipOutX',
    'flipOutY',
  ],
  'Lightspeed': [
    'lightSpeedIn',
    'lightSpeedOut',
  ],
  'Sliding Entrances': [
    'slideInDown',
    'slideInUp',
    'slideInLeft',
    'slideInRight',
  ],
  'Sliding Exits': [
    'slideOutDown',
    'slideOutUp',
    'slideOutLeft',
    'slideOutRight',
  ],
  'Zooming Entrances': [
    'zoomIn',
    'zoomInDown',
    'zoomInUp',
    'zoomInLeft',
    'zoomInRight',
  ],
  'Zooming Exits': [
    'zoomOut',
    'zoomOutDown',
    'zoomOutUp',
    'zoomOutLeft',
    'zoomOutRight',
  ]
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
    marginTop: (Platform.OS === 'ios' ? 40 : 20),
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 20,
  },
  slider: {
    height: 30,
    margin: 10,
  },
  toggle: {
    width: 120,
    backgroundColor: '#333',
    borderRadius: 3,
    padding: 5,
    fontSize: 14,
    alignSelf: 'center',
    textAlign: 'center',
    margin: 10,
    color: 'rgba(255, 255, 255, 1)',
  },
  toggledOn: {
    color: 'rgba(255, 33, 33, 1)',
    fontSize: 16,
    transform: [{
      rotate: '8deg'
    }, {
      translateY: -20
    }]
  },
  sectionHeader: {
    borderTopWidth: 1 / PixelRatio.get(),
    borderColor: '#ccc',
    backgroundColor: '#F5FCFF',
    padding: 10,
  },
  sectionHeaderText: {
    textAlign: 'center',
    fontSize: 16,
  },
  animatableName: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
  },
  animatable: {
    padding: 20,
    margin: 10,
  }
});

export default class ExampleView extends Component {
  constructor(props) {
    super(props);

    this._animatables = {};
    this.state = {
      duration: 1000,
      toggledOn: false
    };
  }

  render() {
    const { duration, toggledOn } = this.state;
    return (
      <View animation="fadeIn" style={styles.container}>
        <Text style={styles.welcome}>Animatable Explorer</Text>
        <View animation="tada" delay={3000}>
          <Slider
            style={styles.slider}
            value={1000}
            onValueChange={duration => this.setState({ duration: Math.round(duration) })}
            maximumValue={2000}
          />
        </View>
        <TouchableWithoutFeedback onPress={() => this.setState({ toggledOn: !toggledOn })}>
          <Text style={[styles.toggle, toggledOn && styles.toggledOn]} transition={['color', 'rotate', 'fontSize']}>Toggle me!</Text>
        </TouchableWithoutFeedback>
        <Text animation="zoomInDown" delay={600} style={styles.instructions}>
          Tap one of the following to animate for {duration} ms
        </Text>

        <ScrollView animation="bounceInUp" duration={800} delay={1400} style={styles.scrollView}>
          <Accordion
            sections={Object.keys(ANIMATION_TYPES)}
            align="center"
            easing="easeInOut"
            renderHeader={section => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section}</Text>
              </View>
            )}
            renderContent={section => ANIMATION_TYPES[section].map((type, i) => (
              <TouchableWithoutFeedback key={i} onPress={() => this._animatables[type][type](duration)}>
                <View ref={component => this._animatables[type] = component} style={[{ backgroundColor: COLORS[i % COLORS.length] }, styles.animatable]}>
                  <Text style={styles.animatableName}>{type}</Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          />
        </ScrollView>
      </View>
    );
  }
}
