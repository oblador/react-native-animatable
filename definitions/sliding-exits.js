function makeSlideOutTranslation(translationType, fromValue) {
  return {
    from: {
      [translationType]: 0,
    },
    to: {
      [translationType]: fromValue,
    },
  };
}

export const slideOutDown = makeSlideOutTranslation('translateY', 100);

export const slideOutUp = makeSlideOutTranslation('translateY', -100);

export const slideOutLeft = makeSlideOutTranslation('translateX', -100);

export const slideOutRight = makeSlideOutTranslation('translateX', 100);
