export type ImageExtension = 'jpg' | 'png' | 'webp';

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = 'RIFF';
const WEBP = 'WEBP';
const WEBP_TAG_OFFSET = 8;
const WEBP_TAG_END = 12;

const startsWith = (buffer: Buffer, bytes: number[]) =>
  bytes.every((byte, index) => buffer[index] === byte);

/** Detects the image type from the file's own bytes, not its name or the declared type. */
export function detectImageType(buffer: Buffer): ImageExtension | null {
  if (startsWith(buffer, JPEG_SIGNATURE)) return 'jpg';
  if (startsWith(buffer, PNG_SIGNATURE)) return 'png';
  if (
    buffer.subarray(0, RIFF.length).toString('ascii') === RIFF &&
    buffer.subarray(WEBP_TAG_OFFSET, WEBP_TAG_END).toString('ascii') === WEBP
  ) {
    return 'webp';
  }
  return null;
}
