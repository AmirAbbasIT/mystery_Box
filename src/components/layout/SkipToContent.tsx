import styles from "./SkipToContent.module.scss";

export function SkipToContent() {
  return (
    <a href="#main-content" className={styles.link}>
      Skip to content
    </a>
  );
}
