import { useEffect, useState } from "react";
import styles from "./DocumentCard.module.css";

export default function ({ text, onClick, deleteHandler, namei }) {
  const [noname, saveNoName] = useState("");
  

  

  const createTitle = (text) => {
    console.log(`this is text ${text}`)
    console.log(`this is filename ${namei}`)
   
    if (namei ) {
      return namei; // If name has a value, use it as the title
    }

    if (text.replace(/<\/?[^>]+(>|$)/g, "")) {
      let parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const title =
        doc.body.childNodes[0].lastChild.innerHTML ||
        doc.body.childNodes[0].innerHTML;
      return title.length > 10 ? `${title.slice(0, 10)}...` : title;
    }

    return "Untitled doc";
  };

  return (
    <div className={styles.wrapper} onClick={onClick}>
      <div
        className={styles.preview}
        dangerouslySetInnerHTML={{ __html: text }}
      ></div>
      <div className={styles.footer}>
        <div className={styles.title}>{createTitle(text)}</div>
        <div className={styles.delete} onClick={deleteHandler}>
          <span role="img" aria-label="bin">
            ❌
          </span>
        </div>
      </div>
    </div>
  );
}
