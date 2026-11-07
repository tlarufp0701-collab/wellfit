/**
 * 단일 HTML 프로토타입 엔트리 (Next.js 앱과 같은 화면 컴포넌트를 해시 라우터로 렌더링)
 * 빌드: npm run build:prototype → dist/wellfit-prototype.html
 */
import { StrictMode, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { NavProvider, type LinkProps } from "@/lib/nav";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui";
import { EmployeeShell } from "@/components/employee-shell";
import { AdminShell } from "@/components/admin-shell";
import Landing from "@/views/Landing";
import EmployeeHome from "@/views/employee/Home";
import AiCoach from "@/views/employee/AiCoach";
import Activity from "@/views/employee/Activity";
import Goals from "@/views/employee/Goals";
import Rewards from "@/views/employee/Rewards";
import Facilities from "@/views/employee/Facilities";
import Report from "@/views/employee/Report";
import AdminDashboard from "@/views/admin/Dashboard";
import Employees from "@/views/admin/Employees";
import AiInsights from "@/views/admin/AiInsights";
import WellnessReport from "@/views/admin/WellnessReport";
import FacilitiesBudget from "@/views/admin/FacilitiesBudget";
import Executive from "@/views/admin/Executive";
import Pilot from "@/views/admin/Pilot";

const ROUTES: Record<string, ComponentType> = {
  "/": Landing,
  "/employee": EmployeeHome,
  "/employee/ai-coach": AiCoach,
  "/employee/activity": Activity,
  "/employee/goals": Goals,
  "/employee/rewards": Rewards,
  "/employee/facilities": Facilities,
  "/employee/report": Report,
  "/admin": AdminDashboard,
  "/admin/employees": Employees,
  "/admin/ai-insights": AiInsights,
  "/admin/wellness-report": WellnessReport,
  "/admin/facilities": FacilitiesBudget,
  "/admin/executive": Executive,
  "/admin/pilot": Pilot,
};

// "/employee/ai-coach" <-> "#employee-ai-coach"
const SEGMENTS = Object.keys(ROUTES);
const toHash = (path: string) => (path === "/" ? "" : "#" + path.slice(1).replace(/\//, "-"));
const fromHash = (hash: string) => {
  const h = hash.replace(/^#/, "");
  if (!h) return "/";
  return SEGMENTS.find((p) => toHash(p) === "#" + h) ?? "/";
};

function HashLink({ href, className, children, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={toHash(href) || "#"}
      className={className}
      aria-label={rest["aria-label"]}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        const h = toHash(href);
        if (h) {
          window.location.hash = h;
        } else {
          history.replaceState(null, "", window.location.pathname + window.location.search);
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
      }}
    >
      {children}
    </a>
  );
}

function App() {
  const [path, setPath] = useState(() => fromHash(window.location.hash));
  useEffect(() => {
    const on = () => setPath(fromHash(window.location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const View = ROUTES[path] ?? Landing;
  const push = (h: string) => {
    window.location.hash = toHash(h);
  };
  let body: ReactNode = <View />;
  if (path.startsWith("/employee")) body = <EmployeeShell>{body}</EmployeeShell>;
  else if (path.startsWith("/admin")) body = <AdminShell>{body}</AdminShell>;
  return (
    <NavProvider value={{ pathname: path, push, Link: HashLink }}>
      <StoreProvider>
        <ToastProvider>{body}</ToastProvider>
      </StoreProvider>
    </NavProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
