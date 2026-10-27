"use client";
// Image with a built-in placeholder.
// Drop a file at /public<src> (e.g. public/images/hero-doctors.jpg) and it shows up automatically;
// until then a neutral "image goes here" frame is rendered with the expected path and size.
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export default function ImageSlot({
  src,
  alt,
  hint,
  size,
  ratio,
  className = "",
}: {
  src: string;
  alt: string;
  /** What kind of photo belongs here (shown only in the placeholder) */
  hint: string;
  /** Recommended pixel size, e.g. "1200×900" */
  size?: string;
  /** CSS aspect-ratio, e.g. "4 / 3" */
  ratio?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The image may have failed before hydration — check once mounted.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div className={`img-slot ${failed ? "is-empty" : ""} ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={ref} src={src} alt={alt} onError={() => setFailed(true)} />
      )}
      {failed && (
        <div className="img-slot-ph" role="img" aria-label={alt}>
          <Icon name="image" size={36} strokeWidth={1.5} />
          <strong>{hint}</strong>
          <code>public{src}</code>
          {size && <span>{size}</span>}
        </div>
      )}
    </div>
  );
}
