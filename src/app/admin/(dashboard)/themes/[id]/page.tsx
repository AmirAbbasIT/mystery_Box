import { notFound } from "next/navigation";
import { getTheme } from "@/admin/services/themes.service";
import { updateThemeAction } from "../actions";
import { ThemeForm } from "../ThemeForm";
import styles from "../themes.module.scss";

export default async function EditThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const theme = await getTheme(id);

  if (!theme) notFound();

  return (
    <div>
      <h1 className={styles.title}>Edit theme</h1>
      <ThemeForm theme={theme} action={updateThemeAction.bind(null, id)} submitLabel="Save changes" />
    </div>
  );
}
