import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import Skeleton from '../../components/Skeleton/Skeleton';
import './StaticPage.css';

export default function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);
      try {
        const data = await api.get(`/settings/page/${slug}`);
        setPage(data.page);
      } catch (err) {
        console.error('Failed to load page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="container container--narrow page-padding">
        <Skeleton variant="page" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container container--narrow page-padding text-center">
        <h2>Page Not Found</h2>
        <Link to="/" className="btn btn--primary mt-md">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="static-page container container--narrow animate-fade-in">
      <h1 className="static-page__title">{page.title}</h1>
      <div
        className="static-page__content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
