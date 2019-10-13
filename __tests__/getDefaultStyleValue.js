/* eslint-env jest */

import getDefaultStyleValue from '../getDefaultStyleValue';

describe('getDefaultStyleValue', () => {
  it('should return 0deg for skew and rotate keys', () => {
    expect(getDefaultStyleValue('skewX')).toEqual('0deg');
    expect(getDefaultStyleValue('skewY')).toEqual('0deg');
    expect(getDefaultStyleValue('rotateX')).toEqual('0deg');
    expect(getDefaultStyleValue('rotateY')).toEqual('0deg');
  });

  it('should fallback to general margins', () => {
    expect(getDefaultStyleValue('marginTop', { margin: 10 })).toEqual(10);
    expect(getDefaultStyleValue('marginTop', { marginVertical: 10 })).toEqual(
      10,
    );
    expect(getDefaultStyleValue('marginLeft', { margin: 10 })).toEqual(10);
    expect(getDefaultStyleValue('marginLeft', { marginVertical: 10 })).toEqual(
      0,
    );
    expect(getDefaultStyleValue('marginHorizontal', { margin: 10 })).toEqual(
      10,
    );
  });

  it('should fallback to general paddings', () => {
    expect(getDefaultStyleValue('paddingTop', { padding: 10 })).toEqual(10);
    expect(getDefaultStyleValue('paddingTop', { paddingVertical: 10 })).toEqual(
      10,
    );
    expect(getDefaultStyleValue('paddingLeft', { padding: 10 })).toEqual(10);
    expect(
      getDefaultStyleValue('paddingLeft', { paddingVertical: 10 }),
    ).toEqual(0);
    expect(getDefaultStyleValue('paddingHorizontal', { padding: 10 })).toEqual(
      10,
    );
  });
});
