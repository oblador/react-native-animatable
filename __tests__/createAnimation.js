/* eslint-env jest */

import createAnimation from '../createAnimation';

describe('createAnimation', () => {
  it('should support from and to keys', () => {
    expect(
      createAnimation({
        from: {
          opacity: 0,
        },
        to: {
          opacity: 1,
        },
      }),
    ).toEqual({
      opacity: {
        inputRange: [0, 1],
        outputRange: [0, 1],
      },
    });
  });

  it('should support fraction keyframes', () => {
    expect(
      createAnimation({
        0: {
          opacity: 0,
        },
        1: {
          opacity: 1,
        },
      }),
    ).toEqual({
      opacity: {
        inputRange: [0, 1],
        outputRange: [0, 1],
      },
    });
  });

  it('should throw if only one keyframe is defined', () => {
    expect(() =>
      createAnimation({
        from: {
          opacity: 1,
        },
      }),
    ).toThrow('Animation definitions must have at least two values.');
  });

  it('should throw if one keyframe is invalid', () => {
    expect(() =>
      createAnimation({
        unparsed: 0.1,
        to: {
          opacity: 1,
        },
      }),
    ).toThrow('Animation definitions must have at least two values.')
  });

  it('should support and flatten transform values', () => {
    expect(
      createAnimation({
        from: {
          transform: [
            {
              translateY: 0,
            },
          ],
        },
        to: {
          transform: [
            {
              translateY: 10,
            },
          ],
        },
      }),
    ).toEqual({
      translateY: {
        inputRange: [0, 1],
        outputRange: [0, 10],
      },
    });
  });

  it('should support and multiple properties with different keyframes', () => {
    expect(
      createAnimation({
        0: {
          transform: [
            {
              scale: 0,
            },
          ],
          opacity: 0,
        },
        0.8: {
          transform: [
            {
              scale: 1,
            },
          ],
        },
        1: {
          opacity: 1,
        },
      }),
    ).toEqual({
      scale: {
        inputRange: [0, 0.8],
        outputRange: [0, 1],
      },
      opacity: {
        inputRange: [0, 1],
        outputRange: [0, 1],
      },
    });
  });

  it('should return value from cache', () => {
    const definition = {
      from: {
        opacity: 0,
      },
      to: {
        opacity: 1,
      },
    }
    const firstAnimation = createAnimation(definition)
    const secondAnimation = createAnimation(definition)
    expect(secondAnimation).toBe(firstAnimation)
  });
});
