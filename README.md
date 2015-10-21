# react-native-animatable
Standard set of easy to use animations for React Native

## Installation

`$ npm install react-native-animatable --save`

## Usage

To animate things you must use the `createAnimatableComponent` composer similar to the `Animated.createAnimatedComponent`. The common components `View`, `Text` and `Image` are precomposed and exposed under the `Animatable` namespace. If you have your own component that you wish to animate, simply wrap it with a `Animatable.View` or compose it with:

```js
var Animatable = require('react-native-animatable');
MyCustomComponent = Animatable.createAnimatableComponent(MyCustomComponent);
```

### Declarative Usage

#### Predefined Animations

```html
<Animatable.Text animation="zoomInUp">Zoom me up, Scotty</Animatable.Text>;
```

#### Generic transitions

You can create your own simple transitions of a style property of your own choosing. The following example will increase the font size by 5 for every tap – all animated, all declarative! If you don't supply a `duration` property, a spring animation will be used. 

```html
<TouchableOpacity onPress={() => this.setState({fontSize: (this.state.fontSize || 10) + 5 })}
  <Animatable.Text transition="fontSize" transitionValue={this.state.fontSize || 10}>Size me up, Scotty</Animatable.Text>;
</TouchableOpacity>
```

#### Properties
*Note: Other properties will be passed down to underlying component.*

| Prop | Description | Default |
|---|---|---|
|**`animation`**|Name of the animation, see below for available animations. |*None*|
|**`duration`**|For how long the animation will run (milliseconds). |`1000`|
|**`delay`**|Optionally delay animation (milliseconds). |`0`|
|**`transition`**|What property to transition, for example `opacity` or `fontSize`. |*None*|
|**`transitionValue`**|Current value of the transition. |`0`|

### Imperative Usage


#### Predefined Animations

All animations are exposed as functions on Animatable elements, they take an optional `duration` argument.

```js
var Animatable = require('react-native-animatable');

React.createClass({
  render: function() {
    return (
      <TouchableWithoutFeedback onPress={() => this.refs.view.bounce(800);}>
        <Animatable.View ref="view">
          <Text>Bounce me!</Text>
        </Animatable.View>
      </TouchableWithoutFeedback>
    );
  }
};
```

#### Generic transitions

##### `transition(property, fromValue, toValue[, duration])`

Will transition given style `property` between `fromValue` and `toValue`. If no `duration` is passed a spring animation will be used. 

##### `transitionTo(property, toValue[, duration])`

This function will try to determine the current value of the style `property` and pass it along to `transition()` as `fromValue`. This requires access to the StyleSheet registry which has long been a private api, but soon [this PR will expose it](https://github.com/facebook/react-native/pull/3308), in the meantime please polyfill like in the example below. If the property is already being transitioned either via a previous call to `transition()` or via the `transition` prop this it not neccessary.  

```js
// Polyfill StyleSheet.flatten if neccesary
if(!StyleSheet.flatten) {
  StyleSheet.flatten = require('flattenStyle');
}
var Animatable = require('react-native-animatable');

React.createClass({
  render: function() {
    return (
      <TouchableWithoutFeedback onPress={() => this.refs.text.transitionTo('opacity', 0.2);}>
        <Animatable.Text ref="text">Fade me!</Animatable.Text>
      </TouchableWithoutFeedback>
    );
  }
};
```

## Demo / Example

See `Example` folder. 

![animatable-demo](https://cloud.githubusercontent.com/assets/378279/10567141/079de586-75c9-11e5-8ea4-e63c0176f519.gif)

## Animations

Animations are heavily inspired by [Animated.css](https://daneden.github.io/animate.css/).

### Attention Seekers

![animatable-attention](https://cloud.githubusercontent.com/assets/378279/10590307/ef73b1ba-767d-11e5-8fb9-9779d3a53a50.gif)

* `bounce`
* `flash`
* `jello`
* `pulse`
* `rubberBand`
* `shake`
* `swing`
* `tada`
* `wobble`

### Bouncing Entrances

![animatable-bouncein](https://cloud.githubusercontent.com/assets/378279/10590306/ef572bbc-767d-11e5-8440-8e61d401537a.gif)

* `bounceIn`
* `bounceInDown`
* `bounceInUp`
* `bounceInLeft`
* `bounceInRight`

### Bouncing Exits

![animatable-bounceout](https://cloud.githubusercontent.com/assets/378279/10590305/ef56e4cc-767d-11e5-9562-6cd3210faf34.gif)

* `bounceOut`
* `bounceOutDown`
* `bounceOutUp`
* `bounceOutLeft`
* `bounceOutRight`

### Fading Entrances

![animatable-fadein](https://cloud.githubusercontent.com/assets/378279/10590304/ef4f09b4-767d-11e5-9a43-06e97e8ee2c1.gif)

* `fadeIn`
* `fadeInDown`
* `fadeInDownBig`
* `fadeInUp`
* `fadeInUpBig`
* `fadeInLeft`
* `fadeInLeftBig`
* `fadeInRight`
* `fadeInRightBig`

### Fading Exits

![animatable-fadeout](https://cloud.githubusercontent.com/assets/378279/10590303/ef3e9598-767d-11e5-83bc-bd48d6017131.gif)

* `fadeOut`
* `fadeOutDown`
* `fadeOutDownBig`
* `fadeOutUp`
* `fadeOutUpBig`
* `fadeOutLeft`
* `fadeOutLeftBig`
* `fadeOutRight`
* `fadeOutRightBig`

### Flippers

![animatable-flip](https://cloud.githubusercontent.com/assets/378279/10590296/ef3076ca-767d-11e5-9f62-6b9c696dad51.gif)

* `flipInX`
* `flipInY`
* `flipOutX`
* `flipOutY`

### Lightspeed

![animatable-lightspeed](https://cloud.githubusercontent.com/assets/378279/10590301/ef374c8e-767d-11e5-83ad-b249d2731f43.gif)

* `lightSpeedIn`
* `lightSpeedOut`

### Sliding Entrances

![animatable-slidein](https://cloud.githubusercontent.com/assets/378279/10590300/ef36dfe2-767d-11e5-932b-1cccce78087b.gif)

* `slideInDown`
* `slideInUp`
* `slideInLeft`
* `slideInRight`

### Sliding Exits

![animatable-slideout](https://cloud.githubusercontent.com/assets/378279/10590299/ef35a3ca-767d-11e5-94e0-441fd49b6444.gif)

* `slideOutDown`
* `slideOutUp`
* `slideOutLeft`
* `slideOutRight`

### Zooming Entrances

![animatable-zoomin](https://cloud.githubusercontent.com/assets/378279/10590302/ef37d438-767d-11e5-8480-a212e21c2192.gif)

* `zoomIn`
* `zoomInDown`
* `zoomInUp`
* `zoomInLeft`
* `zoomInRight`

### Zooming Exits

![animatable-zoomout](https://cloud.githubusercontent.com/assets/378279/10590298/ef33fa52-767d-11e5-80fe-6b8dbb5e53d0.gif)

* `zoomOut`
* `zoomOutDown`
* `zoomOutUp`
* `zoomOutLeft`
* `zoomOutRight`


## License

[MIT License](http://opensource.org/licenses/mit-license.html). © Joel Arvidsson 2015
