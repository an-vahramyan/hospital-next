import Link from "next/link";
import { getI18n } from "@/i18n/server";
import Icon from "../Icon";

export default async function Footer() {
  const { t } = await getI18n();
  const address = process.env.HOSPITAL_ADDRESS || "Երևան, Մաշտոցի պող. 1";
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: "#fff" }}>
              <span className="logo-mark" aria-hidden><Icon name="cross" size={22} /></span>
              <span className="logo-text">{t("brand.name")}</span>
            </div>
            <p className="mt-2">{t("footer.about")}</p>
            <div className="footer-emergency"><Icon name="ambulance" size={20} /> {t("footer.emergency")}</div>
            <div className="socials">
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noreferrer"><Icon name="facebook" size={18} /></a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer"><Icon name="instagram" size={18} /></a>
              <a href="https://t.me" aria-label="Telegram" target="_blank" rel="noreferrer"><Icon name="send" size={18} /></a>
            </div>
          </div>
          <div>
            <h4>{t("footer.links")}</h4>
            <ul>
              {["cardiology", "neurology", "pediatrics", "therapy", "radiology"].map((s) => (
                <li key={s}><Link href={`/doctors?department=${s}`}>{t(`dept.${s}`)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>{t("footer.patients")}</h4>
            <ul>
              <li><Link href="/book">{t("nav.book")}</Link></li>
              <li><Link href="/queue">{t("nav.queue")}</Link></li>
              <li><Link href="/services">{t("nav.services")}</Link></li>
              <li><Link href="/articles">{t("nav.articles")}</Link></li>
              <li><Link href="/patient">{t("nav.myPage")}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t("footer.contacts")}</h4>
            <ul>
              <li className="with-icon"><Icon name="mapPin" size={16} /> {address}</li>
              <li className="with-icon"><Icon name="phone" size={16} /> <a href="tel:+37410000000">+374 10 00 00 00</a></li>
              <li className="with-icon"><Icon name="mail" size={16} /> <a href="mailto:info@hospital.am">info@hospital.am</a></li>
              <li className="with-icon"><Icon name="clock" size={16} /> {t("home.hoursValue")}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {t("brand.name")}. {t("footer.rights")}</span>
          <span>{t("footer.madeWith")}</span>
        </div>
      </div>
    </footer>
  );
}
