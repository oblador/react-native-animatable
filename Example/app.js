import React, { Component } from 'react';
import {
  ListView,
  Platform,
  Slider,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

import { createAnimatableComponent, View, Text } from 'react-native-animatable';
import AnimationCell from './cell';

const AnimatableListView = createAnimatableComponent(ListView);

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
    'rotate',
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
  Flippers: [
    'flipInX',
    'flipInY',
    'flipOutX',
    'flipOutY',
  ],
  Lightspeed: [
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
  ],
};

const NATIVE_INCOMPATIBLE_ANIMATIONS = [
  'jello',
  'swing',
  'tada',
  'wobble',
  'lightSpeedIn',
  'lightSpeedOut',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    textAlign: 'center',
    margin: 20,
    marginTop: (Platform.OS === 'ios' ? 40 : 20),
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 20,
    backgroundColor: 'transparent',
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
      rotate: '8deg',
    }, {
      translateY: -20,
    }],
  },
  sectionHeader: {
    backgroundColor: '#F5FCFF',
    padding: 15,
  },
  sectionHeaderText: {
    textAlign: 'center',
    fontSize: 18,
  },
});

export default class ExampleView extends Component {
  constructor(props) {
    super(props);

    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    });
    this.state = {
      dataSource: dataSource.cloneWithRowsAndSections(ANIMATION_TYPES),
      duration: 1000,
      toggledOn: false,
    };
  }

  textRef = null;
  handleTextRef = (ref) => {
    this.textRef = ref;
  };

  handleDurationChange = (duration) => {
    this.setState({ duration: Math.round(duration) });
  };

  handleRowPressed = (componentRef, animationType) => {
    componentRef.setNativeProps({
      style: {
        zIndex: 1,
      },
    });
    componentRef.animate(animationType, this.state.duration).then(() => {
      componentRef.setNativeProps({
        style: {
          zIndex: 0,
        },
      });
    });
    if (this.textRef) {
      this.textRef[animationType](this.state.duration);
    }
  };

  render() {
    const { dataSource, duration, toggledOn } = this.state;
    return (
      <View animation="fadeIn" style={styles.container} useNativeDriver>
        <Text ref={this.handleTextRef} style={styles.title}>Animatable Explorer</Text>

        <View animation="tada" delay={3000}>
          <Slider
            style={styles.slider}
            value={1000}
            onValueChange={this.handleDurationChange}
            maximumValue={2000}
          />
        </View>
        <TouchableWithoutFeedback onPress={() => this.setState({ toggledOn: !toggledOn })}>
          <Text
            style={[styles.toggle, toggledOn && styles.toggledOn]}
            transition={['color', 'rotate', 'fontSize']}
            useNativeDriver
          >
            Toggle me!
          </Text>
        </TouchableWithoutFeedback>
        <Text animation="zoomInDown" delay={700} style={styles.instructions}>
          Tap one of the following to animate for {duration} ms
        </Text>
        <AnimatableListView
          animation="bounceInUp"
          duration={1100}
          delay={1400}
          style={styles.listView}
          dataSource={dataSource}
          removeClippedSubviews={false}
          renderSectionHeader={(rows, section) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section}</Text>
            </View>
          )}
          renderRow={(animationType, section, i) => (
            <AnimationCell
              animationType={animationType}
              color={COLORS[i % COLORS.length]}
              onPress={this.handleRowPressed}
              useNativeDriver={NATIVE_INCOMPATIBLE_ANIMATIONS.indexOf(animationType) === -1}
            />
          )}
        />
      </View>
    );
  }
}
