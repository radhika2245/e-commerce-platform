import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiHome } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="page not-found-page">
      <Helmet><title>404 - Radhika</title></Helmet>
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">
          <FiHome /> Back to Home
        </Link>
      </div>
    </div>
  );
}
