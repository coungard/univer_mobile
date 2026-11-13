/* eslint-env jest */
// The picker is a native module (issue #94); Jest has no native side, so it is replaced as a whole.
jest.mock('react-native-image-crop-picker', () => {
  const picker = {
    openPicker: jest.fn(),
    openCamera: jest.fn(),
    openCropper: jest.fn(),
    clean: jest.fn(() => Promise.resolve()),
    cleanSingle: jest.fn(() => Promise.resolve()),
  };
  return { __esModule: true, default: picker, ...picker };
});
