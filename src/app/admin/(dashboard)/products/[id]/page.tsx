import { notFound } from "next/navigation";
import { getProduct, listCategoryOptions, listThemeOptions } from "@/admin/services/products.service";
import { updateProductAction } from "../actions";
import { ProductForm } from "../ProductForm";
import styles from "../products.module.scss";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, themes] = await Promise.all([
    getProduct(id),
    listCategoryOptions(),
    listThemeOptions(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className={styles.title}>Edit product</h1>
      <ProductForm
        categories={categories}
        themes={themes}
        product={product}
        action={updateProductAction.bind(null, id)}
        submitLabel="Save changes"
      />
    </div>
  );
}
