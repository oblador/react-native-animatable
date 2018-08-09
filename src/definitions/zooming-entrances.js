import { Easing } from 'react-native';

function makeZoomInTranslation(translationType, pivotPoint) {
  const modifier = Math.min(1, Math.max(-1, pivotPoint));
  return {
    easing: Easing.bezier(0.175, 0.885, 0.32, 1),
    0: {
      opacity: 0,
      scale: 0.1,
      [translationType]: modifier * -1000,
    },
    0.6: {
      opacity: 1,
      scale: 0.457,
      [translationType]: pivotPoint,
    },
    1: {
      scale: 1,
      [translationType]: 0,
    },
  };
}

export const zoomIn = {
  from: {
    opacity: 0,
    scale: 0.3,
  },
  0.5: {
    opacity: 1,
  },
  to: {
    opacity: 1,
    scale: 1,
  },
};

export const zoomInDown = makeZoomInTranslation('translateY', 60);

export const zoomInUp = makeZoomInTranslation('translateY', -60);

export const zoomInLeft = makeZoomInTranslation('translateX', 10);

export const zoomInRight = makeZoomInTranslation('translateX', -10);
