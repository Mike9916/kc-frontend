// kc-frontend/src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./i18n"; // loads i18n system
import { useTranslation } from "react-i18next";

import { getProfile, isLoggedIn, logout } from "./api";

// Pages
import Welcome from "./pages/welcome.jsx";
import Auth from "./pages/Auth.jsx";
import Home from "./pages/home.jsx";
import Reports from "./pages/reports.jsx";
import Media from "./pages/media.jsx";
import Leaders from "./pages/Leaders.jsx";
import Settings from "./pages/settings.jsx";
import AdminConsole from "./pages/Adminconsole.jsx";
import Support from "./pages/support.jsx";

// Helper: role checks
function hasLeaderRole(role) {
  const r = String(role || "").toUpperCase();
  return ["GYJN", "JYJN", "WEJANM", "NEMOBU", "CHMN", "DNGSN", "ADMIN"].includes(r);
}

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useHashScreen();
  const [profile, setProfile] = useState(getProfile());

  // keep profile fresh (e.g., after login in Auth)
  useEffect(() => {
    setProfile(getProfile());
  }, [screen]);

  // Protect leader/admin screens
  const guard = useMemo(() => {
    const role = String(profile?.role || "");
    const isLeader = hasLeaderRole(role);
    const isAdmin = role.toUpperCase() === "ADMIN";
    return { isLeader, isAdmin };
  }, [profile]);

  return (
    <div className="app-root" style={appShell}>
      {/* Top bar */}
      <header className="top-bar" style={topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>KC</span>
          <span style={{ color: "#6b7280" }}>{t("app.title")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {profile && (
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {profile.name} • {profile.role || "SAINT"}
            </span>
          )}
          {isLoggedIn() && (
            <button
              onClick={() => {
                logout();
                window.location.hash = "#/welcome";
              }}
              style={btnGhost}
              title="Log out"
            >
              🚪
            </button>
          )}
        </div>
      </header>

      {/* Content router */}
      <main className="page-content" style={content}>
        {screen === "welcome" && <Welcome go={(s) => setScreen(s)} />}

        {screen === "auth" && <Auth onDone={() => setScreen("home")} />}

        {screen === "home" && <Home go={(s) => setScreen(s)} />}

        {screen === "reports" && <Reports />}

        {screen === "media" && <Media />}

        {screen === "support" && <Support />}

        {screen === "leaders" &&
          (guard.isLeader ? (
            <Leaders />
          ) : (
            <Restricted label={t("leaders.restricted")} />
          ))}

        {screen === "settings" && <Settings />}

        {screen === "admin" &&
          (guard.isAdmin ? (
            <AdminConsole />
          ) : (
            <Restricted label={t("admin.admin_only")} />
          ))}
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav" style={tabs}>
        <Tab
          label={t("app.welcome")}
          active={screen === "welcome"}
          onClick={() => setScreen("welcome")}
        />
        {!isLoggedIn() && (
          <Tab
            label={t("app.auth")}
            active={screen === "auth"}
            onClick={() => setScreen("auth")}
          />
        )}
        {isLoggedIn() && (
          <>
            <Tab
              label={t("app.home")}
              active={screen === "home"}
              onClick={() => setScreen("home")}
            />
            <Tab
              label={t("app.reports")}
              active={screen === "reports"}
              onClick={() => setScreen("reports")}
            />
            <Tab
              label={t("app.media")}
              active={screen === "media"}
              onClick={() => setScreen("media")}
            />
            <Tab
              label={t("app.leaders")}
              active={screen === "leaders"}
              onClick={() => setScreen("leaders")}
            />
            <Tab
              label={t("app.settings")}
              active={screen === "settings"}
              onClick={() => setScreen("settings")}
            />
            <Tab
              label={t("app.admin")}
              active={screen === "admin"}
              onClick={() => setScreen("admin")}
            />

            {/* restricted extra tabs */}
            {guard.isLeader && (
              <>
                {["CULTURE", "ADMIN"].includes(
                  String(profile?.role || "").toUpperCase()
                ) && (
                  <Tab
                    label="Culture"
                    active={screen === "culture"}
                    onClick={() => setScreen("culture")}
                  />
                )}
                {["COMMS", "ADMIN"].includes(
                  String(profile?.role || "").toUpperCase()
                ) && (
                  <Tab
                    label="Communication"
                    active={screen === "communication"}
                    onClick={() => setScreen("communication")}
                  />
                )}
              </>
            )}
          </>
        )}
      </nav>
    </div>
  );
}

// ------------- tiny components & styles -------------

function Restricted({ label }) {
  return (
    <div
      style={{
        padding: 24,
        textAlign: "center",
        color: "#7f1d1d",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: 12,
      }}
    >
      {label}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        background: active ? "#111827" : "#fff",
        color: active ? "#fff" : "#111827",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// Layout styles (mobile-friendly grid: top bar, content, bottom nav)
const appShell = {
  display: "grid",
  gridTemplateRows: "56px 1fr 56px",
  height: "100dvh",
  background: "#f9fafb",
};

const topbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px",
  borderBottom: "1px solid #e5e7eb",
  background: "#fff",
};

const content = {
  padding: 12,
  overflow: "auto",
};

const tabs = {
  display: "flex",
  gap: 6,
  padding: "6px 8px",
  borderTop: "1px solid #e5e7eb",
  background: "#fff",
  position: "sticky",
  bottom: 0,
};

const btnGhost = {
  background: "transparent",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
};

// ------------- hash-based screen (no external router) -------------

function useHashScreen() {
  const [screen, setScreenState] = useState(initialScreen());

  useEffect(() => {
    const onHash = () => setScreenState(currentFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setScreen = (s) => {
    window.location.hash = `#/${s}`;
    setScreenState(s);
  };

  return [screen, setScreen];
}

function initialScreen() {
  return currentFromHash() || (isLoggedIn() ? "home" : "welcome");
}

function currentFromHash() {
  const h = (window.location.hash || "").replace(/^#\/?/, "");
  const valid = new Set([
    "welcome",
    "auth",
    "home",
    "reports",
    "media",
    "announcements",
    "issues",
    "leaders",
    "settings",
    "admin",
    "support",
    "culture",
    "communication",
  ]);
  return valid.has(h) ? h : "";
}