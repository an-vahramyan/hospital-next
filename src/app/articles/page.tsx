import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { listArticles } from "@/lib/services/catalog.service";
import { Empty } from "@/components/ui";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("articles.title") };
}

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { t, f, lang } = await getI18n();
  const data = await listArticles({ lang, page });

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t("articles.title")}</h1>
        <p>{t("articles.subtitle")}</p>
      </div>
      <div className="section-sm">
        {data.items.length === 0 ? (
          <Empty icon="newspaper" title={t("articles.noArticles")} />
        ) : (
          <div className="grid grid-3">
            {data.items.map((a) => (
              <article key={a.id} className="card card-hover article-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {a.coverUrl && <img src={a.coverUrl} alt="" style={{ borderRadius: 10, aspectRatio: "16/9", objectFit: "cover" }} />}
                <span className="date">{f.date(a.publishedAt)}</span>
                <h3><Link href={`/articles/${a.slug}`}>{a.title}</Link></h3>
                <p className="small">{a.content.slice(0, 160)}…</p>
                <Link href={`/articles/${a.slug}`} className="small" style={{ marginTop: "auto", fontWeight: 600 }}>{t("articles.readMore")} →</Link>
              </article>
            ))}
          </div>
        )}
        {data.pages > 1 && (
          <nav className="pagination" aria-label="Pagination">
            {page > 1 && <Link className="btn btn-sm" href={`/articles?page=${page - 1}`}>{t("articles.prev")}</Link>}
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <Link key={p} className={`btn btn-sm ${p === page ? "btn-primary" : ""}`} href={`/articles?page=${p}`}>{p}</Link>
            ))}
            {page < data.pages && <Link className="btn btn-sm" href={`/articles?page=${page + 1}`}>{t("articles.next")}</Link>}
          </nav>
        )}
      </div>
    </div>
  );
}
