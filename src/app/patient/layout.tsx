import DashNav from "@/components/DashNav";

const links = [
  { href: "/patient", label: "patient.dashboard", icon: "🏠", exact: true },
  { href: "/patient/appointments", label: "patient.appointments", icon: "📅" },
  { href: "/patient/prescriptions", label: "patient.prescriptions", icon: "📝" },
  { href: "/patient/examinations", label: "patient.examinations", icon: "🧪" },
  { href: "/patient/medicines", label: "patient.medicines", icon: "💊" },
  { href: "/patient/profile", label: "patient.profile", icon: "👤" },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container dash">
      <DashNav title="patient.menuTitle" links={links} />
      <div className="dash-content">{children}</div>
    </div>
  );
}
