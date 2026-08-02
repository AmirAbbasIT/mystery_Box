"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge, Button, Modal } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import type { Product, Theme } from "@/types";
import { PriceTag } from "./PriceTag";
import styles from "./ProductCard.module.scss";

interface ProductCardProps {
  product: Product;
  themes: Theme[];
}

export function ProductCard({ product, themes }: ProductCardProps) {
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const productThemes = themes.filter((theme) => product.themeIds.includes(theme.id));
  const image = product.images[0];

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.imageWrapper}>
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        )}
        {product.featured && (
          <Badge tone="accent" className={styles.featuredBadge}>
            Bestseller
          </Badge>
        )}
      </div>

      <div className={styles.body}>
        {productThemes.length > 0 && (
          <div className={styles.themeRow}>
            {productThemes.map((theme) => (
              <Badge key={theme.id} tone="secondary">
                {theme.name}
              </Badge>
            ))}
          </div>
        )}

        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>

        <div className={styles.footer}>
          <PriceTag price={product.price} />
          <Button size="sm" variant="outline" onClick={() => setIsPeekOpen(true)}>
            Peek inside
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isPeekOpen}
        onClose={() => setIsPeekOpen(false)}
        title={`What could be inside: ${product.name}`}
      >
        <ul role="list" className={styles.peekList}>
          {product.whatCouldBeInside.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.peekDisclaimer}>
          Contents are randomised — exact items vary by box and are not guaranteed.
        </p>
        <Button className={styles.addButton} onClick={() => setIsPeekOpen(false)}>
          Add to Basket — {formatPrice(product.price)}
        </Button>
      </Modal>
    </motion.article>
  );
}
