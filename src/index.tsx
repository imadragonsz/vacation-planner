import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import "./styles/App.css";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GlobalCalendarPage from "./pages/GlobalCalendarPage";
import PersonalCalendarPage from "./pages/PersonalCalendarPage";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

function Root() {
  const [user, setUser] = React.useState(null);

  return (
    <React.StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<App user={user} setUser={setUser} />} />
          <Route path="/global-calendar" element={<GlobalCalendarPage />} />
          <Route path="/personal-calendar" element={<PersonalCalendarPage />} />
        </Routes>
      </Router>
    </React.StrictMode>
  );
}

root.render(<Root />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
