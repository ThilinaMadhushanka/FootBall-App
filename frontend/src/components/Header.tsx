import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import api from "../utils/api";
import { useCompetition } from "../context/CompetitionContext";

interface UserData {
  full_name?: string;
  username?: string;
}

const managerNavigation = [
  { label: "Dashboard", to: "/home" },
  { label: "Players", to: "/players" },
  { label: "Fixtures", to: "/fixtures" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "My Teams", to: "/my-teams" },
];

const playerNavigation = [
  { label: "Dashboard", to: "/home" },
  { label: "Players", to: "/players" },
  { label: "Fixtures", to: "/fixtures" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "My Profile", to: "/profile" },
];

const viewerNavigation = [
  { label: "Dashboard", to: "/home" },
  { label: "Players", to: "/players" },
  { label: "Fixtures", to: "/fixtures" },
  { label: "Teams & Table", to: "/leaderboard" },
];

const organizerNavigation = [
  { label: "Competition Admin", to: "/competition-admin" },
  { label: "Fixtures", to: "/fixtures" },
  { label: "Players", to: "/players" },
  { label: "Teams & Table", to: "/leaderboard" },
];

const Header: React.FC = () => {
  const { competitions, selectedSeasonID, selectSeason } = useCompetition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: number;
      title: string;
      message: string;
      link: string;
      is_read: boolean;
      created_at: string;
    }>
  >([]);
  const [loggedInUser, setLoggedInUser] = useState<UserData | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return;
    try {
      setLoggedInUser(JSON.parse(user));
    } catch {
      setLoggedInUser(null);
    }
  }, []);
  useEffect(() => {
    const load = () =>
      api
        .get("/notifications")
        .then((r) => setNotifications(Array.isArray(r.data) ? r.data : []))
        .catch(() => undefined);
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);
  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    setNotifications((items) =>
      items.map((item) => ({ ...item, is_read: true })),
    );
  };

  useEffect(() => {
    if (!isDropdownOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const displayName =
    loggedInUser?.full_name || loggedInUser?.username || "Guest";
  const userType = localStorage.getItem("userType");
  const navigation =
    userType === "organizer"
      ? organizerNavigation
      : userType === "viewer"
        ? viewerNavigation
        : userType === "player"
          ? playerNavigation
          : managerNavigation;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-emerald-400/15 text-emerald-300"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        <Link
          to={userType === "organizer" ? "/competition-admin" : "/home"}
          className="flex items-center gap-3"
          aria-label="PlayerPro home"
        >
          <img src="/logo.svg" alt="" className="h-11 w-11 drop-shadow-lg" />
          <span>
            <span className="block text-lg font-extrabold leading-none tracking-tight text-white">
              PlayerPro
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Football Manager
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-200 hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {notifications.some((item) => !item.is_read) && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xl">
                <div className="flex items-center justify-between border-b p-3">
                  <strong>Notifications</strong>
                  <button
                    onClick={markAllRead}
                    className="text-xs font-bold text-blue-600"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-5 text-center text-sm text-slate-500">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <Link
                        key={item.id}
                        to={item.link || "/home"}
                        onClick={async () => {
                          await api.put(`/notifications/${item.id}/read`);
                          setNotificationsOpen(false);
                        }}
                        className={`block border-b p-3 text-sm hover:bg-slate-50 ${item.is_read ? "" : "bg-blue-50"}`}
                      >
                        <p className="font-bold">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.message}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <select
            aria-label="Competition and season"
            value={selectedSeasonID || ""}
            onChange={(event) => selectSeason(Number(event.target.value))}
            className="hidden max-w-52 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 outline-none hover:bg-white/10 md:block"
          >
            {competitions.map((competition) =>
              competition.seasons?.map((season) => (
                <option
                  className="bg-slate-900"
                  key={season.id}
                  value={season.id}
                >
                  {competition.code} · {season.name}
                </option>
              )),
            )}
          </select>
          <div ref={profileMenuRef} className="relative hidden sm:block">
            <button
              onClick={() => setIsDropdownOpen((value) => !value)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 text-sm text-white transition hover:bg-white/10"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-300 to-green-500 text-xs font-bold text-slate-950">
                {initials || <User size={16} />}
              </span>
              <span className="max-w-28 truncate font-medium">
                {displayName}
              </span>
              <ChevronDown
                size={15}
                className={`transition ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-700 shadow-2xl">
                {userType !== "viewer" && userType !== "organizer" && (
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    Profile
                  </Link>
                )}
                <Link
                  to="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 pt-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileOpen((value) => !value)}
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation"
          >
            {isMobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <nav className="grid gap-1 border-t border-white/10 py-3 lg:hidden">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={navClass}
              onClick={() => setIsMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          {userType !== "viewer" && userType !== "organizer" && (
            <NavLink
              to="/profile"
              className={navClass}
              onClick={() => setIsMobileOpen(false)}
            >
              Profile
            </NavLink>
          )}
          <NavLink
            to="/settings"
            className={navClass}
            onClick={() => setIsMobileOpen(false)}
          >
            Settings
          </NavLink>
        </nav>
      )}
    </div>
  );
};

export default Header;
