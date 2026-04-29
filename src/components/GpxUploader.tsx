import { useRef } from "react";
import { GpxHowTo } from "./GpxHowTo";

type Props = {
  loading: boolean;
  error: string | null;
  urlInput: string;
  onUrlChange: (url: string) => void;
  onUrlLoad: () => void;
  onFile: (file: File) => void;
};

export function GpxUploader({
  loading,
  error,
  urlInput,
  onUrlChange,
  onUrlLoad,
  onFile,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <section className="gpx-upload">
      <div
        className="gpx-upload__dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        aria-label="Last opp GPX-fil"
      >
        <svg
          className="gpx-upload__icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 16V4m0 0L8 8m4-4 4 4" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
        <p className="gpx-upload__primary">Dra og slipp ruten din her</p>
        <p className="gpx-upload__secondary">(.gpx-fil — klikk for å velge)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          className="gpx-upload__file-input"
          onChange={handleFileInput}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      <p className="gpx-upload__divider">eller</p>

      <div className="gpx-upload__url-row">
        <input
          type="url"
          className="gpx-upload__url-input"
          placeholder="Lim inn URL til GPX…"
          value={urlInput}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onUrlLoad();
          }}
          aria-label="URL til GPX-fil"
        />
        <button
          className="gpx-upload__url-btn"
          onClick={onUrlLoad}
          disabled={loading || !urlInput.trim()}
        >
          {loading ? "Laster…" : "Last inn"}
        </button>
      </div>

      <p className="gpx-upload__hint">
        Eksporter GPX fra{" "}
        <a href="https://www.strava.com" target="_blank" rel="noopener noreferrer">Strava</a>,{" "}
        <a href="https://connect.garmin.com" target="_blank" rel="noopener noreferrer">Garmin Connect</a>,{" "}
        <a href="https://www.komoot.com" target="_blank" rel="noopener noreferrer">Komoot</a>{" "}
        eller lignende
      </p>

      <GpxHowTo />

      {error && <p className="gpx-upload__error" role="alert">{error}</p>}
    </section>
  );
}
