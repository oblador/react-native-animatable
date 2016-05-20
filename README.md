# react-native-animatable
Easy to use declarative transitions and a standard set of animations for React Native

## Installation

`$ npm install react-native-animatable --save`

## Usage

To animate things you must use the `createAnimatableComponent` composer similar to the `Animated.createAnimatedComponent`. The common components `View`, `Text` and `Image` are precomposed and exposed under the `Animatable` namespace. If you have your own component that you wish to animate, simply wrap it with a `Animatable.View` or compose it with:

```js
import * as Animatable from 'react-native-animatable';
MyCustomComponent = Animatable.createAnimatableComponent(MyCustomComponent);
```

### Declarative Usage

#### Predefined Animations

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
|**`easing`**|Timing function for the animation. Valid values: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`. |`ease-in-out`|
|**`iterationCount`**|How many times to run the animation, use `infinite` for looped animations. |`1`|
|**`transition`**|What `style` property to transition, for example `opacity`, `rotate` or `fontSize`. Use array for multiple properties.  |*None*|
|**`onAnimationBegin`**|A function that is called when the animation has been started. |*None*|
|**`onAnimationEnd`**|A function that is called when the animation has been completed successfully or cancelled. Function is called with an `endState` argument, refer to `endState.finished` to see if the animation completed or not. |*None*|
|**`animationValue`**|default animationValue, Maybe we need a smaller motion animation. use it |*None*| 

### Imperative Usage


#### Predefined Animations

All animations are exposed as functions on Animatable elements, they take an optional `duration` argument. They return a promise that is resolved when animation completes successfully or is cancelled.

```js
import * as Animatable from 'react-native-animatable';

class ExampleView extends Component {
  render() {
    return (
      <TouchableWithoutFeedback onPress={() => this.refs.view.bounce(800).then((endState) => console.log(endState.finished ? 'bounce finished' : 'bounce cancelled');}>
        <Animatable.View ref="view">
          <Text>Bounce me!</Text>
        </Animatable.View>
      </TouchableWithoutFeedback>
    );
  }
}
```

To stop any ongoing animations, just invoke `stopAnimation()` on that element.

#### Generic transitions

##### `transition(fromValues, toValues[[, duration], easing])`

Will transition between given styles. If no `duration` or `easing` is passed a spring animation will be used.

##### `transitionTo(toValues[[, duration], easing])`

This function will try to determine the current styles and pass it along to `transition()` as `fromValues`.

```js
import * as Animatable from 'react-native-animatable';

class ExampleView extends Component {
  render() {
    return (
      <TouchableWithoutFeedback onPress={() => this.refs.text.transitionTo({opacity: 0.2});}>
        <Animatable.Text ref="text">Fade me!</Animatable.Text>
      </TouchableWithoutFeedback>
    );
  }
}
```

## Demo / Example

See `Example` folder.

![animatable-demo](https://cloud.githubusercontent.com/assets/378279/10629128/3c373324-779a-11e5-8311-a3a489575b75.gif)

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
