'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ImageCropper from './ImageCropper';

export type OptionDraft = {
  format: 'text' | 'image';
  text: string;
  image: File | null;
  previewUrl: string | null;
};

type Props = {
  value: OptionDraft;
  index?: number;
  onChange: (value: OptionDraft) => void;
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function OptionEditor({ value, index, onChange }: Props) {
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const previewUrl = value.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [value.previewUrl]);

  function chooseImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError('');
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Choose an image smaller than 8 MB.');
      return;
    }
    setCropSource(file);
  }

  function saveCrop(image: File) {
    const previewUrl = URL.createObjectURL(image);
    onChange({ ...value, format: 'image', image, previewUrl });
    setCropSource(null);
  }

  return (
    <div className="option-editor">
      <div className="option-editor-heading">
        {typeof index === 'number' && <span className="option-number">Option {index + 1}</span>}
        <div className="option-format-tabs" role="group" aria-label="Option format">
          <button type="button" className={value.format === 'text' ? 'selected' : ''} onClick={() => onChange({ ...value, format: 'text' })}>Text</button>
          <button type="button" className={value.format === 'image' ? 'selected' : ''} onClick={() => onChange({ ...value, format: 'image' })}>Image</button>
        </div>
      </div>

      {value.format === 'text' ? (
        <input
          type="text"
          className="glass-input"
          placeholder={`Option ${typeof index === 'number' ? index + 1 : ''}`.trim()}
          value={value.text}
          maxLength={100}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
          required
        />
      ) : (
        <div className="option-image-editor">
          {value.previewUrl ? (
            <div className="option-image-preview-wrap">
              <Image className="option-image-preview" src={value.previewUrl} alt="Cropped option preview" width={240} height={240} unoptimized />
              <button type="button" className="glass-button" onClick={() => setCropSource(value.image)}>Adjust crop</button>
              <button type="button" className="text-button" onClick={() => onChange({ ...value, image: null, previewUrl: null })}>Remove image</button>
            </div>
          ) : (
            <label className="glass-button image-file-picker">
              Choose image
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />
            </label>
          )}
          <p className="muted image-crop-note">Square crop · JPG, PNG, or WebP · up to 8 MB</p>
          {error && <p className="hint" role="alert">{error}</p>}
        </div>
      )}

      {cropSource && <ImageCropper file={cropSource} onCancel={() => setCropSource(null)} onSave={saveCrop} />}
    </div>
  );
}
