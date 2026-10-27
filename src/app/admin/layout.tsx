import DashNav, { type DashLink } from "@/components/DashNav";

const links: DashLink[] = [
  { href: "/admin", label: "admin.dashboard", icon: "chart", exact: true },
  { href: "/admin/appointments", label: "admin.appointments", icon: "calendar" },
  { href: "/admin/patients", label: "admin.patients", icon: "users" },
  { href: "/admin/doctors", label: "admin.doctors", icon: "stethoscope" },
  { href: "/admin/departments", label: "admin.departments", icon: "hospital" },
  { href: "/admin/services", label: "admin.services", icon: "clipboard" },
  { href: "/admin/equipment", label: "admin.equipment", icon: "scan" },
  { href: "/admin/articles", label: "admin.articles", icon: "newspaper" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container dash">
      <DashNav title="admin.menuTitle" links={links} />
      <div className="dash-content">{children}</div>
    </div>
  );
}
