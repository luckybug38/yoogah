import { PercentCrop } from "react-image-crop";
const MAX_AREA = 16777216; 
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
  
    // Calculate the scaling factor if the area exceeds the limit
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;
  
    let canvasWidth = Math.floor(pixelCrop.width * scaleX * pixelRatio);
    let canvasHeight = Math.floor(pixelCrop.height * scaleY * pixelRatio);
  
    const area = canvasWidth * canvasHeight;
    if (area > MAX_AREA) {
      const scalingFactor = Math.sqrt(MAX_AREA / area);
      canvasWidth = Math.floor(canvasWidth * scalingFactor);
      canvasHeight = Math.floor(canvasHeight * scalingFactor);
    }
  
    // Set the adjusted canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  
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
