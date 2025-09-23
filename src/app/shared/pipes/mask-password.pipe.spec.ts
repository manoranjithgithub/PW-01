import { MaskPasswordPipe } from './mask-password.pipe';

describe('MaskPasswordPipe', () => {
  it('create an instance', () => {
    const pipe = new MaskPasswordPipe();
    expect(pipe).toBeTruthy();
  });
});
