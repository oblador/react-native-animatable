function makeFadeInTranslation(translationType, fromValue) {
  return {
    from: {
      opacity: 0,
      [translationType]: fromValue,
    },
    to: {
      opacity: 1,
      [translationType]: 0,
    },
  };
}

export const fadeIn = {
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
};

export const fadeInDown = makeFadeInTranslation('translateY', -100);

export const fadeInUp = makeFadeInTranslation('translateY', 100);

export const fadeInLeft = makeFadeInTranslation('translateX', -100);

export const fadeInRight = makeFadeInTranslation('translateX', 100);

export const fadeInDownBig = makeFadeInTranslation('translateY', -500);

export const fadeInUpBig = makeFadeInTranslation('translateY', 500);

export const fadeInLeftBig = makeFadeInTranslation('translateX', -500);

export const fadeInRightBig = makeFadeInTranslation('translateX', 500);
