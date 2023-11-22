import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerLicense } from "@syncfusion/ej2-base";
registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1NHaF1cWWhIfEx3RXxbf1xzZFNMYFRbQH5PMyBoS35RdURiW39ednRTRGJbWUZ0",
);

import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
