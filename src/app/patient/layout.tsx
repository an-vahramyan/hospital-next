import DashNav, { type DashLink } from "@/components/DashNav";

const links: DashLink[] = [
  { href: "/patient", label: "patient.dashboard", icon: "home", exact: true },
  { href: "/patient/appointments", label: "patient.appointments", icon: "calendar" },
  { href: "/patient/prescriptions", label: "patient.prescriptions", icon: "fileText" },
  { href: "/patient/examinations", label: "patient.examinations", icon: "flask" },
  { href: "/patient/medicines", label: "patient.medicines", icon: "pill" },
  { href: "/patient/profile", label: "patient.profile", icon: "user" },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container dash">
      <DashNav title="patient.menuTitle" links={links} />
      <div className="dash-content">{children}</div>
    </div>
  );
}
