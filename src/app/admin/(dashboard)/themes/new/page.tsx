import { createThemeAction } from "../actions";
import { ThemeForm } from "../ThemeForm";
import styles from "../themes.module.scss";

export default function NewThemePage() {
  return (
    <div>
      <h1 className={styles.title}>New theme</h1>
      <ThemeForm action={createThemeAction} submitLabel="Create theme" />
    </div>
  );
}
