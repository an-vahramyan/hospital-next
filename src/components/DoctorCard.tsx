import Link from "next/link";
import type { TFunction } from "@/i18n/translate";
import { deptName } from "@/i18n/translate";
import { Avatar } from "./ui";

export type DoctorCardData = {
  id: number;
  specialty: string;
  experienceYears: number;
  photoUrl?: string | null;
  user: { firstName: string; lastName: string };
  department: { name: string; slug: string };
};

export default function DoctorCard({ doctor, t }: { doctor: DoctorCardData; t: TFunction }) {
  return (
    <article className="card card-hover doctor-card">
      <div className="top">
        <Avatar firstName={doctor.user.firstName} lastName={doctor.user.lastName} photoUrl={doctor.photoUrl} />
        <div>
          <h3 className="card-title">
            {doctor.user.firstName} {doctor.user.lastName}
          </h3>
          <p className="small">{doctor.specialty}</p>
        </div>
      </div>
      <div className="meta">
        <span className="badge badge-primary">{deptName(t, doctor.department)}</span>
        <span className="badge">{t("doctors.experience", { n: doctor.experienceYears })}</span>
      </div>
      <div className="actions">
        <Link className="btn btn-sm" href={`/doctors/${doctor.id}`}>{t("doctors.details")}</Link>
        <Link className="btn btn-sm btn-primary" href={`/book?doctorId=${doctor.id}`}>{t("doctors.book")}</Link>
      </div>
    </article>
  );
}
