import styles from "./Header.module.css";

export default function ({ onClick }) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.title} onClick={onClick}>
        31G Document Management (POC)
      </p>
    </div>
  );
}
