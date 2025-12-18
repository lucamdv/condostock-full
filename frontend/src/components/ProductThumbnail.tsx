import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

interface ProductThumbnailProps {
  barcode: string;
  alt: string;
  className?: string; // Nova prop para customização
}

export function ProductThumbnail({ barcode, alt, className }: ProductThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!barcode) return;

    fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 1 && (data.product.image_front_url || data.product.image_front_small_url)) {
          setImageUrl(data.product.image_front_url || data.product.image_front_small_url);
        }
      })
      .catch(() => {});
  }, [barcode]);

  if (imageUrl) {
    // MUDANÇA: object-contain garante que a imagem apareça inteira
    // mix-blend-multiply ajuda a remover o fundo branco da imagem se o card for cinza
    return (
      <img 
        src={imageUrl} 
        alt={alt} 
        className={`w-full h-full object-contain p-2 ${className || ''}`}
      />
    );
  }

  return (
    <div className={`w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 ${className || ''}`}>
      <Package size={24} strokeWidth={1.5} />
    </div>
  );
}