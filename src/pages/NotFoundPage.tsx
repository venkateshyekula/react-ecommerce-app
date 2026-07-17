import { Link } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";

const NotFoundPage = () => {
  return (
    <main className="not-found-page bg-light">
      <div className="container py-5">
        <EmptyState
          title="404 - Page Not Found"
          message="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
          action={
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <Link to="/home" className="btn btn-primary">
                <i className="bi bi-house me-2" />
                Go Home
              </Link>

              <Link to="/products" className="btn btn-outline-primary">
                Browse Products
              </Link>
            </div>
          }
        />
      </div>
    </main>
  );
};

export default NotFoundPage;