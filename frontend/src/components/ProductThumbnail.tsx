import { Package } from "lucide-react";
import { useState, useEffect } from "react";

interface ProductThumbnailProps {
  barcode: string;
  alt: string;
  src?: string; 
  className?: string;
}

export function ProductThumbnail({ barcode, alt, src, className }: ProductThumbnailProps) {
  // URLs definidas aqui evitam o erro de tipo 'string | undefined'
  const cosmosUrl = `https://cdn-cosmos.bluesoft.com.br/products/${barcode}`;
  const openFoodUrl = `https://images.openfoodfacts.org/images/products/${barcode}/front_pt.400.jpg`;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (src) {
      setImageSrc(src); // Prioridade: Manual
    } else {
      setImageSrc(cosmosUrl); // Tentativa 1: Automático
    }
  }, [barcode, src, cosmosUrl]);

  const handleError = () => {
    if (imageSrc === cosmosUrl) {
      setImageSrc(openFoodUrl); // Tentativa 2
    } else {
      setHasError(true); // Desiste
    }
  };

  if (hasError || !barcode) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center text-slate-300 ${className || "w-full h-full"}`}>
        <Package size={24} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc || ""}
      alt={alt}
      onError={handleError}
      className={`object-contain w-full h-full mix-blend-multiply ${className}`}
      loading="lazy"
    />
  );
}