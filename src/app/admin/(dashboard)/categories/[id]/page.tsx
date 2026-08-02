import { notFound } from "next/navigation";
import { getCategory } from "@/admin/services/categories.service";
import { updateCategoryAction } from "../actions";
import { CategoryForm } from "../CategoryForm";
import styles from "../categories.module.scss";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategory(id);

  if (!category) notFound();

  return (
    <div>
      <h1 className={styles.title}>Edit category</h1>
      <CategoryForm
        category={category}
        action={updateCategoryAction.bind(null, id)}
        submitLabel="Save changes"
      />
    </div>
  );
}
