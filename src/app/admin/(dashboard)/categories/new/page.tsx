import { createCategoryAction } from "../actions";
import { CategoryForm } from "../CategoryForm";
import styles from "../categories.module.scss";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className={styles.title}>New category</h1>
      <CategoryForm action={createCategoryAction} submitLabel="Create category" />
    </div>
  );
}
