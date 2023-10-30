# react-native-animatable

Transições declarativas e animações para React Native

[![Travis](https://img.shields.io/travis/oblador/react-native-animatable.svg)](https://travis-ci.org/oblador/react-native-animatable) [![npm](https://img.shields.io/npm/v/react-native-animatable.svg)](https://npmjs.com/package/react-native-animatable) [![npm](https://img.shields.io/npm/dm/react-native-animatable.svg)](https://npmjs.com/package/react-native-animatable)

## Traduções
- [English](README.md)

## Instalação

`$ npm install react-native-animatable --save`

## Uso

Para animar as coisas você deve usar o compositor `createAnimatableComponent` similar ao `Animated.createAnimatedComponent`. Os componentes comuns `View`, `Text` e `Image` são pré-compostos e expostos sob o namespace `Animatable`. Se você tiver seu próprio componente que deseja animar, simplesmente envolva-o com um `Animatable.View` ou componha-o com:

```js
import * as Animatable from 'react-native-animatable';
MyCustomComponent = Animatable.createAnimatableComponent(MyCustomComponent);
```

### Uso declarado

#### Animações

```html
<Animatable.Text animation="zoomInUp">Aumente o zoom, Scotty</Animatable.Text>
```

#### Looping

Para fazer animações em loop simplesmente defina `iterationCount` como `infinite`. A maioria das animações, exceto as que buscam atenção, funcionam melhor ao definir `direction` como `alternate`. 

```html
<Animatable.Text animation="slideInDown" iterationCount={5} direction="alternate">Para cima e para baixo você vai</Animatable.Text>
<Animatable.Text animation="pulse" easing="ease-out" iterationCount="infinite" style={{ textAlign: 'center' }}>❤️</Animatable.Text>
```

![Animatable looping demo](https://cloud.githubusercontent.com/assets/378279/10716023/9f4a6670-7b00-11e5-944c-d52a1dcf0884.gif)

#### Transições genéricas

Você pode criar suas próprias transições simples de uma propriedade de estilo de sua própria escolha. O exemplo a seguir aumentará o tamanho da fonte em 5 para cada torneira - todos animados, todos declarativos! Se você não fornece um `duration` Propriedade, uma animação de salto será usada.

*Nota: se você estiver usando cores, use `rgba()` sintaxe.*

*Nota: as transições exigem `StyleSheet.flatten` Disponível no React Native 0.15 ou posterior. Se você estiver funcionando com qualquer coisa mais baixa, por favor, polirilie-se conforme descrito sob uso imperativo.*


```html
<TouchableOpacity onPress={() => this.setState({fontSize: (this.state.fontSize || 10) + 5 })}>
  <Animatable.Text transition="fontSize" style={{fontSize: this.state.fontSize || 10}}>Me amplie, Scotty</Animatable.Text>
</TouchableOpacity>
```

#### Properties
*Nota: Outras propriedades serão transmitidas para o componente subjacente.*

|Prop |Descrição |Padrão |
|---|---|---|
|**`animation`**| Nome da animação, veja abaixo as animações disponíveis.|*Nenhum*|
|**`duration`**| Por quanto tempo a animação será executada (milissegundos). |`1000`|
|**`delay`**| Opcionalmente atrasar a animação (milissegundos). |`0`|
|**`direction`**|Direção da animação, especialmente útil para repetir animações.Valores válidos: `normal`, `reverse`, `alternate`, `alternate-reverse`. |`normal`|
|**`easing`**|Função de tempo para a animação. Valores válidos: função personalizada ou `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `ease-in-cubic`, `ease-out-cubic`, `ease-in-out-cubic`, `ease-in-circ`, `ease-out-circ`, `ease-in-out-circ`, `ease-in-expo`, `ease-out-expo`, `ease-in-out-expo`, `ease-in-quad`, `ease-out-quad`, `ease-in-out-quad`, `ease-in-quart`, `ease-out-quart`, `ease-in-out-quart`, `ease-in-quint`, `ease-out-quint`, `ease-in-out-quint`, `ease-in-sine`, `ease-out-sine`, `ease-in-out-sine`, `ease-in-back`, `ease-out-back`, `ease-in-out-back`. |`ease`|
|**`iterationCount`**|Quantas vezes executa a animação, use `infinite` para animações em loop. |`1`|
|**`iterationDelay`**|Quanto tempo é a pausa entre iterações de animação (milissegundos). |`0`|
|**`transition`**|Qual estilo é proprio para `style` usar na transição, por exemplo `opacity`, `rotate` ou `fontSize`. Use a matriz para várias propriedades.|*Nenhum*|
|**`onAnimationBegin`**|Uma função chamada quando a animação foi iniciada.|*Nenhum*|
|**`onAnimationEnd`**|Uma função chamada quando a animação foi concluída com sucesso ou cancelada. A função é chamada com um `endState` argumento, consulte `endState.finished` Para ver se a animação foi concluída ou não.|*Nenhum*|
|**`onTransitionBegin`**|Uma função que é chamada quando a transição de um estilo foi iniciada.A função é chamada com um argumento de "propriedade" para diferenciar entre estilos.|*Nenhum*|
|**`onTransitionEnd`**|Uma função chamada quando a transição de um estilo foi concluída com sucesso ou cancelada.A função é chamada com um `property` argumento para diferenciar entre estilos.|*Nenhum*|
|**`useNativeDriver`**|Se deve usar o driver de animação nativo ou JavaScript. O driver nativo pode ajudar no desempenho, mas não pode lidar com todos os tipos de estilo. |`false`|
|**`isInteraction`**|Se essa animação cria ou não um "identificador de interação" no interactionManager. |`false` se `iterationCount` é menor ou igual a um |

### Uso imperativo


#### Animações

Todas as animações são expostas como funções em elementos animados, eles assumem um argumento opcional de `duração '.Eles retornam uma promessa resolvida quando a animação é concluída com êxito ou é cancelada.

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

Para parar qualquer animações em andamento, basta invocar `stopAnimation()` nesse elemento.

Você também pode animar imperativamente usando o `animate()` Função no elemento para animações personalizadas, por exemplo:
```
this.view.animate({ 0: { opacity: 0 }, 1: { opacity: 1 } });
```

#### Generic transitions

##### `transition(fromValues, toValues[[, duration], easing])`

A transição entre eles tem estilo. Se não `duration` ou `easing` é passado uma animação de salto para ser usada. 

##### `transitionTo(toValues[[, duration], easing])`

Esta função tentará determinar os estilos atuais e passará a `transition()` como `fromValues`. 

```js
import * as Animatable from 'react-native-animatable';

class ExampleView extends Component {
  handleTextRef = ref => this.text = ref;
  
  render() {
    return (
      <TouchableWithoutFeedback onPress={() => this.text.transitionTo({ opacity: 0.2 })}>
        <Animatable.Text ref={this.handleTextRef}>Faça me desaparecer!</Animatable.Text>
      </TouchableWithoutFeedback>
    );
  }
}
```

## Animações personalizadas

As animações podem ser referidas por um nome global ou um objeto de definição.

### Esquema de definição de animação

Uma definição de animação é um objeto simples que contém um opcional `easing` propriedade, uma opção `style` propriedade para estilos estáticos não animados (úteis para `perspective`, `backfaceVisibility`, `zIndex` etc) e uma lista de quadros -chave.Os quadros -chave são referidos por um número entre 0 e 1 ou `from` e `to`. Inspecione a fonte no `definitions`, uma Pasta para ver mais exemplos de profundidade.

Um desbotamento simples na animação:

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
<Animatable.Text animation={fadeIn} >Me faça desaparecer</Animatable.Text>
```

Combinando vários estilos para criar uma animação de zoom:

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
<Animatable.Text animation={zoomOut} >Me amplie</Animatable.Text>
```

Para disponibilizar suas animações globalmente, referindo-se a eles por um nome, você pode registrá-las como `initializeRegistryWithDefinitions`. Essa função também pode ser usada para substituir as animações incorporadas, caso você queira ajustar algum valor.

```js
Animatable.initializeRegistryWithDefinitions({
  myFancyAnimation: {
    from: { ... },
    to: { ... },
  }
});
```

## Conversa sobre o React na Europe 

[![18922912_1935104760082516_4717918248927023870_o](https://user-images.githubusercontent.com/378279/36341201-fd11e80c-13ea-11e8-8585-ab1d0c5ae27d.jpg)](https://www.youtube.com/watch?v=3SITFIGz4xo)

A palestra é sobre __*Uma nova abordagem para animações declarativas no React Native*__ do React Europe 2017 sobre esta biblioteca e animações/transições em geral e está [Disponível no YouTube](https://www.youtube.com/watch?v=3SITFIGz4xo).

## `MakeItRain` example

See [`Examples/MakeItRain`](https://github.com/oblador/react-native-animatable/tree/master/Examples/MakeItRain) Pasta para o projeto de exemplo da palestra.

[![MakeItRain Example](https://user-images.githubusercontent.com/378279/36341976-06326ad6-13f7-11e8-8fe1-ab947bbea5c8.gif)](https://github.com/oblador/react-native-animatable/tree/master/Examples/MakeItRain)


## exemplo `AnimatableExplorer` 

Ver [`Examples/AnimatableExplorer`](https://github.com/oblador/react-native-animatable/tree/master/Examples/AnimatableExplorer) Pasta para um exemplo de projeto de demonstração de projetos disponíveis para fora da caixa e muito mais.

![Animatable Explorer](https://user-images.githubusercontent.com/378279/36341974-f697e5d8-13f6-11e8-8e2a-21d8c2a4b340.gif)

## Animações

Animações são fortemente inspiradas por [Animated.css](https://daneden.github.io/animate.css/).

### Buscando atenção

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

### Entradas saltitantes

![animatable-bouncein](https://cloud.githubusercontent.com/assets/378279/10590306/ef572bbc-767d-11e5-8440-8e61d401537a.gif)

* `bounceIn`
* `bounceInDown`
* `bounceInUp`
* `bounceInLeft`
* `bounceInRight`

### Saídas saltitantes

![animatable-bounceout](https://cloud.githubusercontent.com/assets/378279/10590305/ef56e4cc-767d-11e5-9562-6cd3210faf34.gif)

* `bounceOut`
* `bounceOutDown`
* `bounceOutUp`
* `bounceOutLeft`
* `bounceOutRight`

### Entradas que somem

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

### Saídas que somem

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

### Surfantes

![animatable-flip](https://cloud.githubusercontent.com/assets/378279/10590296/ef3076ca-767d-11e5-9f62-6b9c696dad51.gif)

* `flipInX`
* `flipInY`
* `flipOutX`
* `flipOutY`

### Velocidade da luz

![animatable-lightspeed](https://cloud.githubusercontent.com/assets/378279/10590301/ef374c8e-767d-11e5-83ad-b249d2731f43.gif)

* `lightSpeedIn`
* `lightSpeedOut`

### Entradas deslizantes

![animatable-slidein](https://cloud.githubusercontent.com/assets/378279/10590300/ef36dfe2-767d-11e5-932b-1cccce78087b.gif)

* `slideInDown`
* `slideInUp`
* `slideInLeft`
* `slideInRight`

### Saídas deslizantes

![animatable-slideout](https://cloud.githubusercontent.com/assets/378279/10590299/ef35a3ca-767d-11e5-94e0-441fd49b6444.gif)

* `slideOutDown`
* `slideOutUp`
* `slideOutLeft`
* `slideOutRight`

### Entradas de ampliação

![animatable-zoomin](https://cloud.githubusercontent.com/assets/378279/10590302/ef37d438-767d-11e5-8480-a212e21c2192.gif)

* `zoomIn`
* `zoomInDown`
* `zoomInUp`
* `zoomInLeft`
* `zoomInRight`

### Saidas de ampliação

![animatable-zoomout](https://cloud.githubusercontent.com/assets/378279/10590298/ef33fa52-767d-11e5-80fe-6b8dbb5e53d0.gif)

* `zoomOut`
* `zoomOutDown`
* `zoomOutUp`
* `zoomOutLeft`
* `zoomOutRight`

## [Changelog](https://github.com/oblador/react-native-animatable/releases)

## licença

[MIT License](http://opensource.org/licenses/mit-license.html). © Joel Arvidsson 2015
