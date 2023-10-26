# react-native-animatable
Declarative transitions and animations for React Native

[![Tests](https://github.com/oblador/react-native-animatable/actions/workflows/tests.yml/badge.svg)](https://github.com/oblador/react-native-animatable/actions/workflows/tests.yml) [![npm](https://img.shields.io/npm/v/react-native-animatable.svg)](https://npmjs.com/package/react-native-animatable) [![npm](https://img.shields.io/npm/dm/react-native-animatable.svg)](https://npmjs.com/package/react-native-animatable)

## Installation

`$ npm install react-native-animatable --save`

## Usage

To animate things you must use the `createAnimatableComponent` composer similar to the `Animated.createAnimatedComponent`. The common components `View`, `Text` and `Image` are precomposed and exposed under the `Animatable` namespace. If you have your own component that you wish to animate, simply wrap it with a `Animatable.View` or compose it with:

```js
import * as Animatable from 'react-native-animatable';
MyCustomComponent = Animatable.createAnimatableComponent(MyCustomComponent);
```

### Declarative Usage

#### Animations

```html
<Animatable.Text animation="zoomInUp">Zoom me up, Scotty</Animatable.Text>
```

#### Looping

To make looping animations simply set the `iterationCount` to `infinite`. Most animations except the attention seekers work best when setting `direction` to `alternate`. 

```html
<Animatable.Text animation="slideInDown" iterationCount={5} direction="alternate">Up and down you go</Animatable.Text>
<Animatable.Text animation="pulse" easing="ease-out" iterationCount="infinite" style={{ textAlign: 'center' }}>❤️</Animatable.Text>
```

![Animatable looping demo](https://cloud.githubusercontent.com/assets/378279/10716023/9f4a6670-7b00-11e5-944c-d52a1dcf0884.gif)

#### Generic transitions

You can create your own simple transitions of a style property of your own choosing. The following example will increase the font size by 5 for every tap – all animated, all declarative! If you don't supply a `duration` property, a spring animation will be used. 

*Note: If you are using colors, please use `rgba()` syntax.*

*Note: Transitions require `StyleSheet.flatten` available in React Native 0.15 or later. If you are running on anything lower, please polyfill as described under imperative usage.*


```html
<TouchableOpacity onPress={() => this.setState({fontSize: (this.state.fontSize || 10) + 5 })}>
  <Animatable.Text transition="fontSize" style={{fontSize: this.state.fontSize || 10}}>Size me up, Scotty</Animatable.Text>
</TouchableOpacity>
```

#### Properties
*Note: Other properties will be passed down to underlying component.*

| Prop | Description | Default |
|---|---|---|
|**`animation`**|Name of the animation, see below for available animations. |*None*|
|**`duration`**|For how long the animation will run (milliseconds). |`1000`|
|**`delay`**|Optionally delay animation (milliseconds). |`0`|
|**`direction`**|Direction of animation, especially useful for repeating animations. Valid values: `normal`, `reverse`, `alternate`, `alternate-reverse`. |`normal`|
|**`easing`**|Timing function for the animation. Valid values: custom function or `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `ease-in-cubic`, `ease-out-cubic`, `ease-in-out-cubic`, `ease-in-circ`, `ease-out-circ`, `ease-in-out-circ`, `ease-in-expo`, `ease-out-expo`, `ease-in-out-expo`, `ease-in-quad`, `ease-out-quad`, `ease-in-out-quad`, `ease-in-quart`, `ease-out-quart`, `ease-in-out-quart`, `ease-in-quint`, `ease-out-quint`, `ease-in-out-quint`, `ease-in-sine`, `ease-out-sine`, `ease-in-out-sine`, `ease-in-back`, `ease-out-back`, `ease-in-out-back`. |`ease`|
|**`iterationCount`**|How many times to run the animation, use `infinite` for looped animations. |`1`|
|**`iterationDelay`**|For how long to pause between animation iterations (milliseconds). |`0`|
|**`transition`**|What `style` property to transition, for example `opacity`, `rotate` or `fontSize`. Use array for multiple properties.  |*None*|
|**`onAnimationBegin`**|A function that is called when the animation has been started. |*None*|
|**`onAnimationEnd`**|A function that is called when the animation has been completed successfully or cancelled. Function is called with an `endState` argument, refer to `endState.finished` to see if the animation completed or not. |*None*|
|**`onTransitionBegin`**|A function that is called when the transition of a style has been started. The function is called with a `property` argument to differentiate between styles. |*None*|
|**`onTransitionEnd`**|A function that is called when the transition of a style has been completed successfully or cancelled. The function is called with a `property` argument to differentiate between styles. |*None*|
|**`useNativeDriver`**|Whether to use native or JavaScript animation driver. Native driver can help with performance but cannot handle all types of styling.  |`false`|
|**`isInteraction`**|Whether or not this animation creates an "interaction handle" on the InteractionManager.  |`false` if `iterationCount` is less than or equal to one|

### Imperative Usage


#### Animations

All animations are exposed as functions on Animatable elements, they take an optional `duration` argument. They return a promise that is resolved when animation completes successfully or is cancelled. 

```js
import * as Animatable from 'react-native-animatable';

class ExampleView extends Component {
  handleViewRef = ref => this.view = ref;
  
  bounce = () => this.view.bounce(800).then(endState => console.log(endState.finished ? 'bounce finished' : 'bounce cancelled'));
  
  render() {
    return (
      <TouchableWithoutFeedback onPress={this.bounce}>
        <Animatable.View ref={this.handleViewRef}>
          <Text>Bounce me!</Text>
        </Animatable.View>
      </TouchableWithoutFeedback>
    );
  }
}
```

To stop any ongoing animations, just invoke `stopAnimation()` on that element. 

You can also animate imperatively by using the `animate()` function on the element for custom animations, for example:
```
this.view.animate({ 0: { opacity: 0 }, 1: { opacity: 1 } });
```

#### Generic transitions

##### `transition(fromValues, toValues[[, duration], easing])`

Will transition between given styles. If no `duration` or `easing` is passed a spring animation will be used. 

##### `transitionTo(toValues[[, duration], easing])`

This function will try to determine the current styles and pass it along to `transition()` as `fromValues`. 

```js
import * as Animatable from 'react-native-animatable';

class ExampleView extends Component {
  handleTextRef = ref => this.text = ref;
  
  render() {
    return (
      <TouchableWithoutFeedback onPress={() => this.text.transitionTo({ opacity: 0.2 })}>
        <Animatable.Text ref={this.handleTextRef}>Fade me!</Animatable.Text>
      </TouchableWithoutFeedback>
    );
  }
}
```

## Custom Animations

Animations can be referred to by a global name or a definition object. 

### Animation Definition Schema

An animation definition is a plain object that contains an optional `easing` property, an optional `style` property for static non-animated styles (useful for `perspective`, `backfaceVisibility`, `zIndex` etc) and a list of keyframes. The keyframes are refered to by a number between 0 to 1 or `from` and `to`. Inspect the source in the `definitions` folder to see more in depth examples. 

A simple fade in animation: 

```js
const fadeIn = {
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
};
```
```html
<Animatable.Text animation={fadeIn} >Fade me in</Animatable.Text>
```

Combining multiple styles to create a zoom out animation: 

```js
const zoomOut = {
  0: {
    opacity: 1,
    scale: 1,
  },
  0.5: {
    opacity: 1,
    scale: 0.3,
  },
  1: {
    opacity: 0,
    scale: 0,
  },
};
```
```html
<Animatable.Text animation={zoomOut} >Zoom me out</Animatable.Text>
```

To make your animations globally available by referring to them by a name, you can register them with `initializeRegistryWithDefinitions`. This function can also be used to replace built in animations in case you want to tweak some value. 

```js
Animatable.initializeRegistryWithDefinitions({
  myFancyAnimation: {
    from: { ... },
    to: { ... },
  }
});
```

## React Europe Talk

[![18922912_1935104760082516_4717918248927023870_o](https://user-images.githubusercontent.com/378279/36341201-fd11e80c-13ea-11e8-8585-ab1d0c5ae27d.jpg)](https://www.youtube.com/watch?v=3SITFIGz4xo)

The talk __*A Novel Approach to Declarative Animations in React Native*__ from React Europe 2017 about this library and animations/transitions in general is [available on YouTube](https://www.youtube.com/watch?v=3SITFIGz4xo).

## `MakeItRain` example

See [`Examples/MakeItRain`](https://github.com/oblador/react-native-animatable/tree/master/Examples/MakeItRain) folder for the example project from the talk. 

[![MakeItRain Example](https://user-images.githubusercontent.com/378279/36341976-06326ad6-13f7-11e8-8fe1-ab947bbea5c8.gif)](https://github.com/oblador/react-native-animatable/tree/master/Examples/MakeItRain)


## `AnimatableExplorer` example

See [`Examples/AnimatableExplorer`](https://github.com/oblador/react-native-animatable/tree/master/Examples/AnimatableExplorer) folder for an example project demoing animations available out of the box and more. 

![Animatable Explorer](https://user-images.githubusercontent.com/378279/36341974-f697e5d8-13f6-11e8-8e2a-21d8c2a4b340.gif)

## Animations

Animations are heavily inspired by [Animated.css](https://daneden.github.io/animate.css/).

### Attention Seekers

![animatable-attention](https://cloud.githubusercontent.com/assets/378279/10590307/ef73b1ba-767d-11e5-8fb9-9779d3a53a50.gif)

* `bounce`
* `flash`
* `jello`
* `pulse`
* `rotate`
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

## [Changelog](https://github.com/oblador/react-native-animatable/releases)

## License

[MIT License](http://opensource.org/licenses/mit-license.html). © Joel Arvidsson 2015
