import { listCategoryOptions, listThemeOptions } from "@/admin/services/products.service";
import { createProductAction } from "../actions";
import { ProductForm } from "../ProductForm";
import styles from "../products.module.scss";

export default async function NewProductPage() {
  const [categories, themes] = await Promise.all([listCategoryOptions(), listThemeOptions()]);

  return (
    <div>
      <h1 className={styles.title}>New product</h1>
      <ProductForm
        categories={categories}
        themes={themes}
        action={createProductAction}
        submitLabel="Create product"
      />
    </div>
  );
}
