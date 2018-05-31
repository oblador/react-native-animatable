import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';
import { View } from 'react-native-animatable';

const styles = StyleSheet.create({
  cell: {
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  name: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default class AnimationCell extends PureComponent {
  static propTypes = {
    animationType: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onPress: PropTypes.func.isRequired,
    useNativeDriver: PropTypes.bool.isRequired,
  };

  ref = null;
  handleRef = ref => {
    this.ref = ref;
  };

  handlePress = () => {
    if (this.ref && this.props.onPress) {
      this.props.onPress(this.ref, this.props.animationType);
    }
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this.handlePress}>
        <View
          ref={this.handleRef}
          style={[{ backgroundColor: this.props.color }, styles.cell]}
          useNativeDriver={this.props.useNativeDriver}
        >
          <Text style={styles.name}>{this.props.animationType}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
