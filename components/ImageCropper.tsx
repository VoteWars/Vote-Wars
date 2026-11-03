'use client';

import { useEffect, useMemo, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

type Props = {
  file: File;
  onCancel: () => void;
  onSave: (file: File) => void;
};

async function cropToSquare(source: string, area: Area): Promise<File> {
  const image = new Image();
  image.src = source;
  await image.decode();

  const maxSide = 1200;
  const outputSize = Math.min(maxSide, Math.max(1, Math.round(area.width)));
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare your cropped image.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, outputSize, outputSize);
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outputSize,
    outputSize
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error('Could not export the cropped image.')),
      'image/jpeg',
      0.9
    );
  });
  return new File([blob], 'option-image.jpg', { type: 'image/jpeg' });
}

export default function ImageCropper({ file, onCancel, onSave }: Props) {
  const [source, setSource] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const cropAreaComplete = useMemo(
    () => (_: Area, pixels: Area) => setArea(pixels),
    []
  );

  async function save() {
    if (!source || !area || saving) return;
    setSaving(true);
    setError('');
    try {
      onSave(await cropToSquare(source, area));
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : 'Could not crop image.');
      setSaving(false);
    }
  }

  return (
    <div className="crop-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onCancel();
    }}>
      <section className="crop-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <div className="crop-modal-heading">
          <div>
            <h2 id="crop-title">Crop your option</h2>
            <p className="muted">Drag and zoom to frame a square image.</p>
          </div>
          <button type="button" className="glass-button crop-close" onClick={onCancel} aria-label="Cancel crop">×</button>
        </div>
        <div className="crop-stage">
          {source && (
            <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={1}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={cropAreaComplete}
            />
          )}
        </div>
        <label className="crop-zoom-label">
          Zoom
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
        {error && <p className="hint" role="alert">{error}</p>}
        <div className="crop-modal-actions">
          <button type="button" className="glass-button" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="button" className="glass-button primary-button" onClick={save} disabled={!area || saving}>
            {saving ? 'Cropping…' : 'Use this crop'}
          </button>
        </div>
      </section>
    </div>
  );
}
