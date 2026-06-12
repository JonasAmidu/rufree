import { toPublicLocation } from '../utils/privacy';

describe('privacy utilities', () => {
  it('rounds precise coordinates before they are written to public discovery data', () => {
    expect(
      toPublicLocation({
        latitude: 51.507351,
        longitude: -0.127758
      })
    ).toEqual({
      latitude: 51.507,
      longitude: -0.128
    });
  });

  it('returns null for incomplete coordinates', () => {
    expect(toPublicLocation({ latitude: 51.507351 })).toBeNull();
    expect(toPublicLocation(null)).toBeNull();
  });
});
