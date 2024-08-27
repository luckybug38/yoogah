import React, { useRef, useState } from "react";
import ReactCrop, {
  makeAspectCrop,
  Crop,
  centerCrop,
  PercentCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import setCanvasPreview from "./setCanvasPreview"; // Assuming this utility is in the same directory
import Modal from "react-modal";
import styles from "./CropModal.module.css";

interface ExtendedCrop extends Crop {
  aspect?: number;
}

interface CropModalProps {
  src: string;
  onConfirm: (croppedImage: Blob) => void;
  onCancel: () => void;
  isOpen: boolean;
  onRequestClose: () => void;
}

const ASPECT_RATIO = 1;

const CropModal: React.FC<CropModalProps> = ({
  src,
  onConfirm,
  onCancel,
  isOpen,
  onRequestClose,
}) => {
  const [crop, setCrop] = useState<ExtendedCrop>({
    unit: "%",
    width: 30,
    aspect: 1 / 1,
    x: 0,
    y: 0,
    height: 30,
  });
  const [completedCrop, setCompletedCrop] = useState<PercentCrop | null>(null);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;
    const cropWidthInPercent = 100;

    const crop = makeAspectCrop(
      {
        unit: "%",
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);
    setCrop(centeredCrop);
    imgRef.current = event.currentTarget;

    // Manually call handleComplete with the initial crop
    handleComplete(centeredCrop);
  };

  const handleComplete = (c: PercentCrop) => {
    setCompletedCrop(c);
    if (imgRef.current && previewCanvasRef.current && c.width && c.height) {
      setCanvasPreview(imgRef.current, previewCanvasRef.current, c);
    }
  };

  const handleConfirm = async () => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      setLoading(true); // Start loading spinner
      previewCanvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await onConfirm(blob);
          setLoading(false); // Stop loading spinner after processing is complete
        }
      });
    }
  };

  return (
    <Modal
      ariaHideApp={false}
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      contentLabel="Crop Image"
      className={styles.Modal}
      overlayClassName={styles.Overlay}
    >
      <div className={styles.cropContainer}>
        <ReactCrop
          crop={crop}
          onChange={(newCrop) => setCrop(newCrop)}
          onComplete={(_, percentCrop) => handleComplete(percentCrop)}
          circularCrop
        >
          <img
            src={src}
            alt="Crop"
            onLoad={onImageLoad}
            className={styles.cropImage}
          />
        </ReactCrop>
        <div className={styles.buttons}>
          <button
            className="luckybug-btn luckybug-grey mr-2"
            onClick={onCancel}
            disabled={loading} // Disable cancel button while loading
          >
            Cancel
          </button>
          <button
            className="luckybug-btn"
            onClick={handleConfirm}
            disabled={loading} // Disable confirm button while loading
          >
            {loading ? (
              <span className={styles.spinner} /> // Display spinner while loading
            ) : (
              "Confirm"
            )}
          </button>
        </div>
        <canvas ref={previewCanvasRef} style={{ display: "none" }} />
      </div>
    </Modal>
  );
};

export default CropModal;
