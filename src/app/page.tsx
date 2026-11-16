import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { listArticles, listDoctors, listEquipment, listServices, publicStats } from "@/lib/services/catalog.service";
import DoctorCard from "@/components/DoctorCard";
import ServiceCard from "@/components/ServiceCard";
import Icon from "@/components/Icon";
import ImageSlot from "@/components/ImageSlot";

export default async function HomePage() {
  const { t, f, lang } = await getI18n();
  const [stats, services, doctors, equipment, articles] = await Promise.all([
    publicStats(),
    listServices(undefined, 6),
    listDoctors({ take: 4 }),
    listEquipment({ onlyNew: true, take: 3 }),
    listArticles({ lang, pageSize: 3 }),
  ]);
  const address = process.env.HOSPITAL_ADDRESS || "Երևան, Մաշտոցի պող. 1";

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-pill"><span className="dot" /> {t("home.pill")}</span>
            <h1>
              {t("home.heroTitle1")} <em>{t("home.heroTitle2")}</em>
            </h1>
            <p className="hero-sub">{t("home.heroSubtitle")}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" href="/book"><Icon name="calendar" /> {t("home.bookCta")}</Link>
              <Link className="btn btn-lg" href="/doctors"><Icon name="search" /> {t("home.findDoctor")}</Link>
            </div>
          </div>
          <div className="hero-media">
            <ImageSlot
              src="/images/hero-doctors.jpg"
              alt={t("home.heroImageAlt")}
              hint="Բժիշկների / բուժանձնակազմի լուսանկար"
              size="1200×900"
              ratio="4 / 3"
            />
            <div className="hero-badge">
              <span className="hero-badge-icon"><Icon name="shieldCheck" size={22} /></span>
              <span>{t("home.heroBadge")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="quick-bar" aria-label={t("home.quickTitle")}>
        <div className="container quick-grid">
          <Link className="quick-item" href="/queue">
            <span className="quick-icon"><Icon name="ticket" size={22} /></span>
            <span>{t("home.quickQueue")}</span>
            <Icon name="arrowRight" size={18} className="quick-arrow" />
          </Link>
          <Link className="quick-item" href="/patient/medicines">
            <span className="quick-icon green"><Icon name="pill" size={22} /></span>
            <span>{t("home.quickMedicines")}</span>
            <Icon name="arrowRight" size={18} className="quick-arrow" />
          </Link>
          <Link className="quick-item" href="/doctors">
            <span className="quick-icon"><Icon name="stethoscope" size={22} /></span>
            <span>{t("home.findDoctor")}</span>
            <Icon name="arrowRight" size={18} className="quick-arrow" />
          </Link>
          <a className="quick-item emergency" href="tel:103">
            <span className="quick-icon"><Icon name="ambulance" size={22} /></span>
            <span>
              <span className="xs">{t("home.emergency")}</span>
              <strong>911 · 103</strong>
            </span>
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="section-sm">
        <div className="container stats">
          <div className="stat"><div className="stat-icon"><Icon name="hospital" size={22} /></div><div><div className="stat-value">25+</div><div className="stat-label">{t("home.statsYears")}</div></div></div>
          <div className="stat"><div className="stat-icon"><Icon name="stethoscope" size={22} /></div><div><div className="stat-value">{stats.doctors}</div><div className="stat-label">{t("home.statsDoctors")}</div></div></div>
          <div className="stat"><div className="stat-icon green"><Icon name="heartPulse" size={22} /></div><div><div className="stat-value">{Math.max(stats.patients, 1) * 1000}+</div><div className="stat-label">{t("home.statsPatients")}</div></div></div>
          <div className="stat"><div className="stat-icon green"><Icon name="microscope" size={22} /></div><div><div className="stat-value">{stats.departments}</div><div className="stat-label">{t("home.statsDepartments")}</div></div></div>
        </div>
      </section>

      {/* Why us */}
      <section className="section">
        <div className="container about-grid">
          <ImageSlot
            src="/images/about-clinic.jpg"
            alt={t("home.aboutImageAlt")}
            hint="Կլինիկայի ինտերիեր / ընդունարան"
            size="1000×1100"
            ratio="10 / 11"
            className="about-media"
          />
          <div>
            <span className="eyebrow">{t("brand.name")}</span>
            <h2>{t("home.whyTitle")}</h2>
            <p className="mt-1">{t("home.whySub")}</p>
            <div className="grid grid-2 mt-3">
              {(["calendar", "scan", "pill", "folder"] as const).map((icon, i) => (
                <div key={icon} className="feature">
                  <div className="feature-icon"><Icon name={icon} size={22} /></div>
                  <div>
                    <h3 style={{ fontSize: "1rem" }}>{t(`home.why${i + 1}t`)}</h3>
                    <p className="small mt-1">{t(`home.why${i + 1}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <div><h2>{t("home.servicesTitle")}</h2><p>{t("home.servicesSub")}</p></div>
            <Link className="btn" href="/services">{t("home.servicesAll")} →</Link>
          </div>
          <div className="grid grid-3">
            {services.map((s) => <ServiceCard key={s.id} service={s} t={t} f={f} />)}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div><h2>{t("home.doctorsTitle")}</h2><p>{t("home.doctorsSub")}</p></div>
            <Link className="btn" href="/doctors">{t("home.doctorsAll")} →</Link>
          </div>
          <div className="grid grid-4">
            {doctors.map((d) => <DoctorCard key={d.id} doctor={d} t={t} />)}
          </div>
        </div>
      </section>

      {/* Equipment */}
      {equipment.length > 0 && (
        <section className="section section-tint">
          <div className="container">
            <div className="section-head">
              <div><h2>{t("home.equipmentTitle")}</h2><p>{t("home.equipmentSub")}</p></div>
              <Link className="btn" href="/equipment">{t("home.equipmentAll")} →</Link>
            </div>
            <div className="grid grid-3">
              {equipment.map((e) => (
                <article key={e.id} className="card equip-card card-hover">
                  <div className="equip-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {e.imageUrl ? <img src={e.imageUrl} alt={e.name} /> : <Icon name="scan" size={44} className="equip-ph" />}
                    {e.isNew && <span className="badge badge-new">{t("equipment.new")}</span>}
                  </div>
                  <div className="equip-body">
                    <h3 className="card-title">{e.name}</h3>
                    {e.description && <p className="small">{e.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles */}
      {articles.items.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div><h2>{t("home.articlesTitle")}</h2><p>{t("home.articlesSub")}</p></div>
              <Link className="btn" href="/articles">{t("home.articlesAll")} →</Link>
            </div>
            <div className="grid grid-3">
              {articles.items.map((a) => (
                <article key={a.id} className="card card-hover article-card">
                  <span className="date">{f.date(a.publishedAt)}</span>
                  <h3><Link href={`/articles/${a.slug}`}>{a.title}</Link></h3>
                  <p className="small">{a.content.slice(0, 140)}…</p>
                  <Link href={`/articles/${a.slug}`} className="small" style={{ marginTop: "auto", fontWeight: 600 }}>{t("articles.readMore")} →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contacts */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid grid-2" style={{ alignItems: "stretch" }}>
          <div className="card stack">
            <h2>{t("home.contactsTitle")}</h2>
            <dl className="kv">
              <dt className="with-icon"><Icon name="mapPin" size={16} /> {t("home.address")}</dt><dd>{address}</dd>
              <dt className="with-icon"><Icon name="phone" size={16} /> {t("home.phone")}</dt><dd><a href="tel:+37410000000">+374 10 00 00 00</a></dd>
              <dt className="with-icon"><Icon name="clock" size={16} /> {t("home.hours")}</dt><dd>{t("home.hoursValue")}</dd>
              <dt className="with-icon"><Icon name="ambulance" size={16} /> {t("home.emergency")}</dt><dd>{t("home.hoursEmergency")} · 911 / 103</dd>
            </dl>
            <Link className="btn btn-primary" href="/book" style={{ alignSelf: "flex-start" }}>{t("home.bookCta")}</Link>
          </div>
          <iframe
            className="map"
            title="Map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
          />
        </div>
      </section>
    </>
  );
}
