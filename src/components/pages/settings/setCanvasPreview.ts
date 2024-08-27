import { PercentCrop } from "react-image-crop";

/**
 * Sets the preview of the canvas with the cropped image.
 *
 * @param image - The HTMLImageElement to be cropped.
 * @param canvas - The HTMLCanvasElement where the cropped image will be rendered.
 * @param crop - The PercentCrop object representing the cropping area.
 */
const setCanvasPreview = (
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PercentCrop
): void => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Convert PercentCrop to pixel values
  const pixelCrop = {
    x: (crop.x / 100) * image.width,
    y: (crop.y / 100) * image.height,
    width: (crop.width / 100) * image.width,
    height: (crop.height / 100) * image.height,
  };

  // devicePixelRatio slightly increases sharpness on retina devices
  // at the expense of slightly slower render times and needing to
  // size the image back down if you want to download/upload and be
  // true to the image's natural size.
  const pixelRatio = window.devicePixelRatio;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(pixelCrop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(pixelCrop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";
  ctx.save();

  const cropX = pixelCrop.x * scaleX;
  const cropY = pixelCrop.y * scaleY;

  // Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();
};

export default setCanvasPreview;
