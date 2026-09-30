import {
  getActiveColorPalette,
  getShippingSettingsForAdmin,
} from "@/admin/services/site-settings.service";
import { updateColorPaletteAction, updateShippingAction } from "./actions";
import { SettingsForm } from "./SettingsForm";
import { ShippingForm } from "./ShippingForm";
import styles from "./settings.module.scss";

export default async function AdminSettingsPage() {
  const [currentPaletteId, shipping] = await Promise.all([
    getActiveColorPalette(),
    getShippingSettingsForAdmin(),
  ]);

  return (
    <div>
      <h1 className={styles.title}>Settings</h1>
      <SettingsForm currentPaletteId={currentPaletteId} action={updateColorPaletteAction} />
      <hr className={styles.divider} />
      <ShippingForm current={shipping} action={updateShippingAction} />
    </div>
  );
}
