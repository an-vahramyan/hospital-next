import Link from "next/link";
import { notFound } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { getArticle } from "@/lib/services/catalog.service";

const load = (slug: string) => getArticle(slug).catch(() => null);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await load((await params).slug);
  return { title: a?.title ?? "404", description: a?.content.slice(0, 160) };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await load((await params).slug);
  if (!article) notFound();
  const { t, f } = await getI18n();
  return (
    <div className="container section-sm">
      <Link href="/articles" className="small">{t("articles.backToList")}</Link>
      <article className="prose mt-3">
        <span className="badge">{f.date(article.publishedAt)}</span>
        <h1 className="mt-2 mb-3">{article.title}</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {article.coverUrl && <img src={article.coverUrl} alt="" style={{ borderRadius: 16, marginBottom: 24 }} />}
        {article.content.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
      </article>
    </div>
  );
}
