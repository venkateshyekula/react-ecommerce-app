import { useMemo, useState, useEffect } from "react";
import type { Product } from "../../types/product";

interface ProductImageGalleryProps {
  product: Product;
}

interface GalleryImage {
  src: string;
  label: string;
}

const ProductImageGallery = ({ product }: ProductImageGalleryProps) => {
  const galleryImages = useMemo<GalleryImage[]>(() => {
    const encodedName = encodeURIComponent(product.name);

    return [
      {
        src: product.image,
        label: "Main View"
      },
      {
        src: `https://placehold.co/600x400/e8f0fe/1967d2?text=${encodedName}+View+2`,
        label: "Side View"
      },
      {
        src: `https://placehold.co/600x400/e6f4ea/188038?text=${encodedName}+Details`,
        label: "Detail View"
      },
      {
        src: `https://placehold.co/600x400/fef7e0/ea8600?text=${encodedName}+Package`,
        label: "Package View"
      }
    ];
  }, [product.image, product.name]);

  const [selectedImage, setSelectedImage] = useState<GalleryImage>(
    galleryImages[0]
  );

  // Sync selected image if the product switches out (crucial for "Similar Products" clicks)
  useEffect(() => {
    setSelectedImage(galleryImages[0]);
  }, [galleryImages]);

  return (
    <div className="product-gallery bg-white rounded-4 shadow-sm p-3">
      {/* FIXED: Changed from raw string rendering to an actual img element */}
      <div className="product-gallery-main position-relative mb-3 text-center bg-light rounded-3 overflow-hidden">
        <img
          src={selectedImage.src}
          alt={`${product.name} - ${selectedImage.label}`}
          className="img-fluid object-fit-contain"
          style={{ maxHeight: "400px", width: "100%" }}
          onError={(e) => {
            e.currentTarget.src = "/placeholder-image.png";
          }}
        />

        {product.discount > 0 ? (
          <span className="badge bg-danger product-gallery-discount position-absolute top-3 start-3">
            {product.discount}% OFF
          </span>
        ) : null}
      </div>

      {/* FIXED: Thumbnails updated from text to viewable img elements */}
      <div className="product-gallery-thumbnails d-flex gap-2 overflow-x-auto pb-1">
        {galleryImages.map((image) => {
          const isActive = selectedImage.src === image.src;

          return (
            <button
              key={image.label}
              type="button"
              className={`btn p-0 border rounded-3 overflow-hidden transition-all product-gallery-thumbnail-btn ${
                isActive ? "border-primary border-2 shadow-sm" : "border-light-subtle"
              }`}
              style={{ width: "80px", height: "60px", flexShrink: 0 }}
              onClick={() => setSelectedImage(image)}
              aria-label={`Show ${image.label}`}
            >
              <img
                src={image.src}
                alt={image.label}
                className="w-100 h-100 object-fit-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductImageGallery;