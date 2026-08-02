import { getActiveColorPalette } from "@/admin/services/site-settings.service";
import { updateColorPaletteAction } from "./actions";
import { SettingsForm } from "./SettingsForm";
import styles from "./settings.module.scss";

export default async function AdminSettingsPage() {
  const currentPaletteId = await getActiveColorPalette();

  return (
    <div>
      <h1 className={styles.title}>Settings</h1>
      <SettingsForm currentPaletteId={currentPaletteId} action={updateColorPaletteAction} />
    </div>
  );
}
