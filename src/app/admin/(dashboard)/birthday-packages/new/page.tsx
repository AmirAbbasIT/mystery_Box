import { listThemeOptions } from "@/admin/services/products.service";
import { createBirthdayPackageAction } from "../actions";
import { BirthdayPackageForm } from "../BirthdayPackageForm";
import styles from "../birthday-packages.module.scss";

export default async function NewBirthdayPackagePage() {
  const themes = await listThemeOptions();

  return (
    <div>
      <h1 className={styles.title}>New birthday package</h1>
      <BirthdayPackageForm
        themes={themes}
        action={createBirthdayPackageAction}
        submitLabel="Create package"
      />
    </div>
  );
}
