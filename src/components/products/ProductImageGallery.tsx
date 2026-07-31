import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

import type { Product, ProductMediaItem } from "../../types/product";

/* ==========================================================================
   Types
   ========================================================================== */

interface ProductImageGalleryProps {
  product: Product;
}

interface GalleryMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string;
  alt: string;
  label: string;
}

interface ZoomPosition {
  x: number;
  y: number;
}

/* ==========================================================================
   Constants
   ========================================================================== */

const FALLBACK_IMAGE_URL = "/placeholder-image.png";

/* ==========================================================================
   Helpers
   ========================================================================== */

const hasValidMediaUrl = (url: string | undefined): boolean => {
  return Boolean(url?.trim());
};

const normalizeMediaItem = (
  media: ProductMediaItem,
  index: number,
  productName: string,
): GalleryMediaItem => {
  const mediaNumber = index + 1;

  const defaultLabel =
    media.type === "VIDEO"
      ? `Product Video ${mediaNumber}`
      : `Product Image ${mediaNumber}`;

  return {
    id: media.id.trim() || `product-media-${mediaNumber}`,
    type: media.type,
    url: media.url.trim(),
    thumbnailUrl: media.thumbnailUrl?.trim() || undefined,
    alt: media.alt.trim() || `${productName} ${defaultLabel}`,
    label: media.label?.trim() || defaultLabel,
  };
};

/* ==========================================================================
   Product Image Gallery
   ========================================================================== */

const ProductImageGallery = ({ product }: ProductImageGalleryProps) => {
  const thumbnailContainerRef = useRef<HTMLDivElement | null>(null);

  const previewCloseButtonRef = useRef<HTMLButtonElement | null>(null);

  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);

  const [failedMediaIds, setFailedMediaIds] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const [isZoomEnabled, setIsZoomEnabled] = useState<boolean>(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const [zoomPosition, setZoomPosition] = useState<ZoomPosition>({
    x: 50,
    y: 50,
  });

  /* ==========================================================================
     Build Gallery Media
     ========================================================================== */

  const galleryMedia = useMemo<GalleryMediaItem[]>(() => {
    const actualMedia = (product.media ?? [])
      .filter((media) => hasValidMediaUrl(media.url))
      .map((media, index) => normalizeMediaItem(media, index, product.name));

    /*
     * Product media has the highest priority.
     * The legacy main image is used only when media is unavailable.
     */
    if (actualMedia.length > 0) {
      return actualMedia;
    }

    if (hasValidMediaUrl(product.image)) {
      return [
        {
          id: `${product.id}-main-image`,
          type: "IMAGE",
          url: product.image.trim(),
          alt: product.name,
          label: "Main Image",
        },
      ];
    }

    /*
     * The local placeholder is used only when the product has
     * no valid media or main image.
     */
    return [
      {
        id: `${product.id}-fallback-image`,
        type: "IMAGE",
        url: FALLBACK_IMAGE_URL,
        alt: `${product.name} image unavailable`,
        label: "Image Unavailable",
      },
    ];
  }, [product.id, product.image, product.media, product.name]);

  const activeMedia = galleryMedia[activeMediaIndex] ?? galleryMedia[0];

  const activeMediaUrl = failedMediaIds.has(activeMedia.id)
    ? FALLBACK_IMAGE_URL
    : activeMedia.url;

  const hasMultipleMedia = galleryMedia.length > 1;

  /* ==========================================================================
     Reset Gallery When Product Changes
     ========================================================================== */

  useEffect(() => {
    setActiveMediaIndex(0);
    setFailedMediaIds(new Set<string>());
    setIsZoomEnabled(false);
    setIsPreviewOpen(false);
    setZoomPosition({
      x: 50,
      y: 50,
    });
  }, [product.id]);

  /* ==========================================================================
     Preview Dialog Behavior
     ========================================================================== */

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      previewCloseButtonRef.current?.focus();
    });

    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveMediaIndex((currentIndex) =>
          currentIndex === 0 ? galleryMedia.length - 1 : currentIndex - 1,
        );

        setIsZoomEnabled(false);
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveMediaIndex((currentIndex) =>
          currentIndex === galleryMedia.length - 1 ? 0 : currentIndex + 1,
        );

        setIsZoomEnabled(false);
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [galleryMedia.length, isPreviewOpen]);

  /* ==========================================================================
     Gallery Navigation
     ========================================================================== */

  const resetZoom = (): void => {
    setIsZoomEnabled(false);
    setZoomPosition({
      x: 50,
      y: 50,
    });
  };

  const selectMedia = (index: number): void => {
    if (index < 0 || index >= galleryMedia.length) {
      return;
    }

    setActiveMediaIndex(index);
    resetZoom();
  };

  const showPreviousMedia = (): void => {
    setActiveMediaIndex((currentIndex) =>
      currentIndex === 0 ? galleryMedia.length - 1 : currentIndex - 1,
    );

    resetZoom();
  };

  const showNextMedia = (): void => {
    setActiveMediaIndex((currentIndex) =>
      currentIndex === galleryMedia.length - 1 ? 0 : currentIndex + 1,
    );

    resetZoom();
  };

  /* ==========================================================================
     Thumbnail Keyboard Navigation
     ========================================================================== */

  const focusThumbnailAtIndex = (index: number): void => {
    const thumbnailButtons =
      thumbnailContainerRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      );

    thumbnailButtons?.[index]?.focus();
  };

  const handleThumbnailKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void => {
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();

        nextIndex = index === galleryMedia.length - 1 ? 0 : index + 1;
        break;

      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();

        nextIndex = index === 0 ? galleryMedia.length - 1 : index - 1;
        break;

      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;

      case "End":
        event.preventDefault();
        nextIndex = galleryMedia.length - 1;
        break;

      case "Enter":
      case " ":
        event.preventDefault();
        selectMedia(index);
        return;

      default:
        return;
    }

    selectMedia(nextIndex);

    window.requestAnimationFrame(() => {
      focusThumbnailAtIndex(nextIndex);
    });
  };

  /* ==========================================================================
     Image Failure Handling
     ========================================================================== */

  const handleImageError = (mediaId: string): void => {
    setFailedMediaIds((currentFailedIds) => {
      if (currentFailedIds.has(mediaId)) {
        return currentFailedIds;
      }

      const updatedFailedIds = new Set(currentFailedIds);

      updatedFailedIds.add(mediaId);

      return updatedFailedIds;
    });
  };

  /* ==========================================================================
     Image Zoom
     ========================================================================== */

  const toggleZoom = (): void => {
    if (activeMedia.type !== "IMAGE") {
      return;
    }

    setIsZoomEnabled((currentValue) => !currentValue);

    setZoomPosition({
      x: 50,
      y: 50,
    });
  };

  const handleZoomMouseMove = (event: MouseEvent<HTMLButtonElement>): void => {
    if (!isZoomEnabled || activeMedia.type !== "IMAGE") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }

    const x = ((event.clientX - bounds.left) / bounds.width) * 100;

    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomPosition({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const handleZoomMouseLeave = (): void => {
    setZoomPosition({
      x: 50,
      y: 50,
    });
  };

  /* ==========================================================================
     Preview Dialog
     ========================================================================== */

  const openPreview = (): void => {
    setIsPreviewOpen(true);
  };

  const closePreview = (): void => {
    setIsPreviewOpen(false);
  };

  const handlePreviewBackdropClick = (
    event: MouseEvent<HTMLDivElement>,
  ): void => {
    if (event.target === event.currentTarget) {
      closePreview();
    }
  };

  /* ==========================================================================
     Media Render Helpers
     ========================================================================== */

  const getThumbnailUrl = (media: GalleryMediaItem): string => {
    if (failedMediaIds.has(media.id)) {
      return FALLBACK_IMAGE_URL;
    }

    return media.thumbnailUrl ?? media.url;
  };

  /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <>
      <section
        className="product-gallery"
        aria-label={`${product.name} media gallery`}
      >
        {/* Main Media */}
        <div
          className={[
            "product-gallery-main",
            isZoomEnabled && activeMedia.type === "IMAGE" ? "zoom-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {activeMedia.type === "VIDEO" ? (
            <video
              key={activeMedia.id}
              className="product-gallery-main-video"
              controls
              playsInline
              preload="metadata"
              poster={activeMedia.thumbnailUrl}
              aria-label={activeMedia.alt}
            >
              <source src={activeMedia.url} />
              Your browser does not support product videos.
            </video>
          ) : (
            <button
              type="button"
              className={[
                "product-gallery-image-button",
                isZoomEnabled ? "zoom-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={
                isZoomEnabled
                  ? `Disable zoom for ${activeMedia.alt}`
                  : `Zoom ${activeMedia.alt}`
              }
              aria-pressed={isZoomEnabled}
              onClick={toggleZoom}
              onMouseMove={handleZoomMouseMove}
              onMouseLeave={handleZoomMouseLeave}
            >
              <img
                src={activeMediaUrl}
                alt={activeMedia.alt}
                onError={() => handleImageError(activeMedia.id)}
                style={{
                  transform: isZoomEnabled ? "scale(2.25)" : "scale(1)",
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              />
            </button>
          )}

          {/* Discount */}
          {product.discount > 0 ? (
            <span className="product-gallery-discount">
              {product.discount}% OFF
            </span>
          ) : null}

          {/* Zoom and Preview Toolbar */}
          <div className="product-gallery-toolbar">
            {activeMedia.type === "IMAGE" ? (
              <button
                type="button"
                className={[
                  "product-gallery-tool-button",
                  isZoomEnabled ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={
                  isZoomEnabled ? "Disable image zoom" : "Enable image zoom"
                }
                aria-pressed={isZoomEnabled}
                onClick={toggleZoom}
              >
                <i
                  className={isZoomEnabled ? "bi bi-zoom-out" : "bi bi-zoom-in"}
                  aria-hidden="true"
                />

                <span>{isZoomEnabled ? "Reset" : "Zoom"}</span>
              </button>
            ) : null}

            <button
              type="button"
              className="product-gallery-tool-button"
              aria-label={`Open large preview of ${activeMedia.label}`}
              onClick={openPreview}
            >
              <i className="bi bi-arrows-fullscreen" aria-hidden="true" />

              <span>Preview</span>
            </button>
          </div>

          {/* Previous and Next Controls */}
          {hasMultipleMedia ? (
            <>
              <button
                type="button"
                className="product-gallery-navigation product-gallery-navigation-previous"
                aria-label="Show previous product media"
                onClick={showPreviousMedia}
              >
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="product-gallery-navigation product-gallery-navigation-next"
                aria-label="Show next product media"
                onClick={showNextMedia}
              >
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </button>
            </>
          ) : null}

          {/* Media Counter */}
          <span className="product-gallery-media-counter" aria-live="polite">
            {activeMediaIndex + 1} / {galleryMedia.length}
          </span>
        </div>

        {/* Thumbnails */}
        {hasMultipleMedia ? (
          <div
            ref={thumbnailContainerRef}
            className="product-gallery-thumbnails"
            role="tablist"
            aria-label="Product media thumbnails"
          >
            {galleryMedia.map((media, index) => {
              const isActive = activeMediaIndex === index;

              const thumbnailUrl = getThumbnailUrl(media);

              return (
                <button
                  key={media.id}
                  id={`product-media-tab-${product.id}-${index}`}
                  type="button"
                  role="tab"
                  className={[
                    "product-gallery-thumbnail",
                    isActive ? "active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`Show ${media.label}`}
                  aria-selected={isActive}
                  aria-controls={`product-media-panel-${product.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => selectMedia(index)}
                  onKeyDown={(event) => handleThumbnailKeyDown(event, index)}
                >
                  {media.type === "VIDEO" && !media.thumbnailUrl ? (
                    <span className="product-gallery-video-placeholder">
                      <i
                        className="bi bi-play-circle-fill"
                        aria-hidden="true"
                      />

                      <span>Video</span>
                    </span>
                  ) : (
                    <img
                      src={thumbnailUrl}
                      alt={media.alt}
                      onError={() => handleImageError(media.id)}
                    />
                  )}

                  {media.type === "VIDEO" ? (
                    <span
                      className="product-gallery-video-indicator"
                      aria-hidden="true"
                    >
                      <i className="bi bi-play-fill" />
                    </span>
                  ) : null}

                  <span className="visually-hidden">{media.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* Large Preview */}
      {isPreviewOpen
        ? createPortal(
            <div
              className="product-gallery-preview-overlay"
              role="presentation"
              onClick={handlePreviewBackdropClick}
            >
              <section
                className="product-gallery-preview-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-gallery-preview-title"
                aria-describedby="product-gallery-preview-description"
              >
                <header className="product-gallery-preview-header">
                  <div className="product-gallery-preview-heading">
                    <strong id="product-gallery-preview-title">
                      {product.name}
                    </strong>

                    <span id="product-gallery-preview-description">
                      {activeMedia.label}
                    </span>
                  </div>

                  <button
                    ref={previewCloseButtonRef}
                    type="button"
                    className="product-gallery-preview-close"
                    aria-label="Close large media preview"
                    onClick={closePreview}
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                </header>

                <div className="product-gallery-preview-content">
                  {activeMedia.type === "VIDEO" ? (
                    <video
                      key={`preview-${activeMedia.id}`}
                      className="product-gallery-preview-video"
                      controls
                      autoPlay
                      playsInline
                      poster={activeMedia.thumbnailUrl}
                      aria-label={activeMedia.alt}
                    >
                      <source src={activeMedia.url} />
                      Your browser does not support product videos.
                    </video>
                  ) : (
                    <img
                      src={activeMediaUrl}
                      alt={activeMedia.alt}
                      onError={() => handleImageError(activeMedia.id)}
                    />
                  )}

                  {hasMultipleMedia ? (
                    <>
                      <button
                        type="button"
                        className="product-gallery-preview-navigation product-gallery-preview-previous"
                        aria-label="Show previous product media"
                        onClick={showPreviousMedia}
                      >
                        <i className="bi bi-chevron-left" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        className="product-gallery-preview-navigation product-gallery-preview-next"
                        aria-label="Show next product media"
                        onClick={showNextMedia}
                      >
                        <i className="bi bi-chevron-right" aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                </div>

                {hasMultipleMedia ? (
                  <div className="product-gallery-preview-thumbnails">
                    {galleryMedia.map((media, index) => {
                      const isActive = activeMediaIndex === index;

                      const thumbnailUrl = getThumbnailUrl(media);

                      return (
                        <button
                          key={`preview-${media.id}`}
                          type="button"
                          className={[
                            "product-gallery-preview-thumbnail",
                            isActive ? "active" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-label={`Show ${media.label}`}
                          aria-pressed={isActive}
                          onClick={() => selectMedia(index)}
                        >
                          {media.type === "VIDEO" && !media.thumbnailUrl ? (
                            <span className="product-gallery-video-placeholder">
                              <i
                                className="bi bi-play-circle-fill"
                                aria-hidden="true"
                              />

                              <span className="visually-hidden">Video</span>
                            </span>
                          ) : (
                            <img
                              src={thumbnailUrl}
                              alt={media.alt}
                              onError={() => handleImageError(media.id)}
                            />
                          )}

                          {media.type === "VIDEO" ? (
                            <span
                              className="product-gallery-video-indicator"
                              aria-hidden="true"
                            >
                              <i className="bi bi-play-fill" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export default ProductImageGallery;