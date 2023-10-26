import React, {useCallback} from 'react';
import {
  SafeAreaView,
  SectionList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {View, Text, Animation} from 'react-native-animatable';
import Slider from '@react-native-community/slider';
import AnimationCell from './AnimationCell';
import {animationTypes} from './groupedAnimationTypes';

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

const NATIVE_INCOMPATIBLE_ANIMATIONS = [
  'jello',
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
    transform: [
      {
        rotate: '8deg',
      },
      {
        translateY: -20,
      },
    ],
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

export default function App() {
  const [duration, setDuration] = React.useState(1000);
  const [toggledOn, setToggledOn] = React.useState(false);
  const textRef = React.useRef<Text>(null);

  const handleRowPressed = useCallback(
    (componentRef: typeof View, animationType: Animation) => {
      componentRef.animate(animationType, duration);
      textRef.current?.animate(animationType, duration);
    },
    [duration],
  );

  return (
    <View animation="fadeIn" style={styles.container} useNativeDriver>
      <SafeAreaView>
        <Text ref={textRef} style={styles.title}>
          Animatable Explorer
        </Text>
      </SafeAreaView>

      <View animation="tada" delay={3000}>
        <Slider
          style={styles.slider}
          value={1000}
          onSlidingComplete={value => setDuration(Math.round(value))}
          maximumValue={2000}
        />
      </View>
      <TouchableWithoutFeedback onPress={() => setToggledOn(prev => !prev)}>
        <Text
          style={[styles.toggle, toggledOn && styles.toggledOn]}
          transition={['color', 'rotate', 'fontSize']}>
          Toggle me!
        </Text>
      </TouchableWithoutFeedback>
      <Text animation="zoomInDown" delay={700} style={styles.instructions}>
        Tap one of the following to animate for {duration} ms
      </Text>
      <View
        animation="bounceInUp"
        duration={1100}
        delay={1400}
        style={styles.container}>
        <SectionList
          contentInsetAdjustmentBehavior="automatic"
          keyExtractor={item => item}
          sections={animationTypes}
          removeClippedSubviews={false}
          renderSectionHeader={({section}) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({item, index}) => (
            <AnimationCell
              animationType={item}
              color={COLORS[index % COLORS.length]}
              onPress={handleRowPressed}
              useNativeDriver={
                NATIVE_INCOMPATIBLE_ANIMATIONS.indexOf(item) === -1
              }
            />
          )}
        />
      </View>
    </View>
  );
}
