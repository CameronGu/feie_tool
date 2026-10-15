import { APP_URL, AUTHOR_NAME, AUTHOR_URL, DISCLAIMER } from '@/constants/meta';
import { APP_VERSION } from '@/version';

const displayUrl = APP_URL.replace(/^https?:\/\//, '');

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-meta">
        <span className="footer-credit">
          by{' '}
          <a className="footer-link" href={AUTHOR_URL} target="_blank" rel="noreferrer">
            {AUTHOR_NAME}
          </a>
        </span>
        <span aria-hidden="true" className="footer-separator">
          ·
        </span>
        <a className="footer-link" href={APP_URL} target="_blank" rel="noreferrer">
          {displayUrl}
        </a>
        <span aria-hidden="true" className="footer-separator">
          ·
        </span>
        <span className="footer-build">Build {APP_VERSION}</span>
      </div>
      <p className="footer-disclaimer">
        {DISCLAIMER}
      </p>
      <p className="footer-app-name">
        Travel stays in your browser. No accounts, travel-data submissions or analytics.
      </p>
    </footer>
  );
}
