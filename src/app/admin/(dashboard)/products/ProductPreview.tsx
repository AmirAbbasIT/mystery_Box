"use client";

import { useState } from "react";
import { Badge, Button, Modal } from "@/components/ui";
import { PriceTag } from "@/components/product/PriceTag";
import { formatPrice } from "@/lib/utils";
import cardStyles from "@/components/product/ProductCard.module.scss";
import styles from "./ProductPreview.module.scss";

interface PreviewTheme {
  id: string;
  name: string;
}

interface ProductPreviewProps {
  name: string;
  description: string;
  pricePence: number;
  featured: boolean;
  image?: { src: string; alt: string };
  themes: PreviewTheme[];
  whatCouldBeInside: string[];
}

/**
 * Mirrors ProductCard's exact markup/classes (imported from its own .module.scss, not
 * reimplemented) so this is a true preview of the real storefront card, not a lookalike. The one
 * intentional divergence: no framer-motion entrance animation and a plain <img> instead of
 * next/image, since the admin is typing an in-progress/possibly-invalid image path — those would
 * fight the live-typing experience rather than help it.
 */
export function ProductPreview({
  name,
  description,
  pricePence,
  featured,
  image,
  themes,
  whatCouldBeInside,
}: ProductPreviewProps) {
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const price = pricePence / 100;

  return (
    <aside className={styles.panel}>
      <p className={styles.heading}>Live preview</p>
      <article className={cardStyles.card}>
        <div className={cardStyles.imageWrapper}>
          {image?.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- live preview of an in-progress path, next/image would fight partial input
            <img src={image.src} alt={image.alt} className={styles.previewImage} />
          ) : (
            <div className={styles.imagePlaceholder}>No image yet</div>
          )}
          {featured && (
            <Badge tone="accent" className={cardStyles.featuredBadge}>
              Bestseller
            </Badge>
          )}
        </div>

        <div className={cardStyles.body}>
          {themes.length > 0 && (
            <div className={cardStyles.themeRow}>
              {themes.map((theme) => (
                <Badge key={theme.id} tone="secondary">
                  {theme.name}
                </Badge>
              ))}
            </div>
          )}

          <h3 className={cardStyles.name}>{name || "Product name"}</h3>
          <p className={cardStyles.description}>{description || "Product description…"}</p>

          <div className={cardStyles.footer}>
            <PriceTag price={price} />
            <Button size="sm" variant="outline" onClick={() => setIsPeekOpen(true)}>
              Peek inside
            </Button>
          </div>
        </div>

        <Modal
          isOpen={isPeekOpen}
          onClose={() => setIsPeekOpen(false)}
          title={`What could be inside: ${name || "Product name"}`}
        >
          {whatCouldBeInside.length > 0 ? (
            <ul role="list" className={cardStyles.peekList}>
              {whatCouldBeInside.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Nothing entered yet.</p>
          )}
          <p className={cardStyles.peekDisclaimer}>
            Contents are randomised — exact items vary by box and are not guaranteed.
          </p>
          <Button className={cardStyles.addButton} onClick={() => setIsPeekOpen(false)}>
            Add to Basket — {formatPrice(price)}
          </Button>
        </Modal>
      </article>
    </aside>
  );
}
