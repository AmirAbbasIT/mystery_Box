import { notFound } from "next/navigation";
import { listThemeOptions } from "@/admin/services/products.service";
import { getBirthdayPackage } from "@/admin/services/birthday-packages.service";
import { updateBirthdayPackageAction } from "../actions";
import { BirthdayPackageForm } from "../BirthdayPackageForm";
import styles from "../birthday-packages.module.scss";

export default async function EditBirthdayPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, themes] = await Promise.all([getBirthdayPackage(id), listThemeOptions()]);

  if (!pkg) notFound();

  return (
    <div>
      <h1 className={styles.title}>Edit birthday package</h1>
      <BirthdayPackageForm
        pkg={pkg}
        themes={themes}
        action={updateBirthdayPackageAction.bind(null, id)}
        submitLabel="Save changes"
      />
    </div>
  );
}
