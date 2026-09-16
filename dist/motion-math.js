export const IMAGE_ASPECT = 1942 / 809;
export const FACE = [0.513, 0.2885];
export function coverLayout(width, height, mobile = false) {
  const aspect = width / Math.max(height, 1);
  const scale = aspect > IMAGE_ASPECT ? [1, IMAGE_ASPECT / aspect] : [aspect / IMAGE_ASPECT, 1];
  const position = [mobile ? .525 : .5, 1];
  return { scale, offset: [(1 - scale[0]) * position[0], (1 - scale[1]) * position[1]] };
}
export function targetGaze(clientX, clientY, rect, layout) {
  const eyeX = rect.left + (FACE[0] - layout.offset[0]) / layout.scale[0] * rect.width;
  const eyeY = rect.top + (FACE[1] - layout.offset[1]) / layout.scale[1] * rect.height;
  const clamp = value => Math.max(-1, Math.min(1, value));
  return [clamp((clientX - eyeX) / Math.max(rect.width * .38, 240)), clamp((clientY - eyeY) / Math.max(rect.height * .44, 190))];
}
export function damp(current, target, deltaSeconds, speed) {
  return current + (target - current) * (1 - Math.exp(-Math.min(Math.max(deltaSeconds, 0), .05) * speed));
}
