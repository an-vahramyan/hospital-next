import DashNav from "@/components/DashNav";

const links = [
  { href: "/admin", label: "admin.dashboard", icon: "📊", exact: true },
  { href: "/admin/appointments", label: "admin.appointments", icon: "📅" },
  { href: "/admin/patients", label: "admin.patients", icon: "🧑‍🤝‍🧑" },
  { href: "/admin/doctors", label: "admin.doctors", icon: "👩‍⚕️" },
  { href: "/admin/departments", label: "admin.departments", icon: "🏥" },
  { href: "/admin/services", label: "admin.services", icon: "🩺" },
  { href: "/admin/equipment", label: "admin.equipment", icon: "🩻" },
  { href: "/admin/articles", label: "admin.articles", icon: "📰" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container dash">
      <DashNav title="admin.menuTitle" links={links} />
      <div className="dash-content">{children}</div>
    </div>
  );
}
