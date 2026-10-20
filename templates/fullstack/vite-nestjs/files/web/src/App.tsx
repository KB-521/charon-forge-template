import { useEffect, useState } from 'react';
import { ReusableExamples } from './examples/ReusableExamples';
import { formatDateTime } from './lib/display-time';
import { setLocale, t, useLocale } from './lib/i18n/translator';
import { request } from './lib/request';
import { setServerClock, useServerClock } from './lib/server-clock';

interface Health {
  status: 'ok';
  service: string;
  environment: string;
  timestamp: string;
}

function ServerTime() {
  const now = useServerClock();
  const locale = useLocale();
  return Number.isFinite(now) ? (
    <div className="server-time">
      <span>{t('clock.title')}</span>
      <time dateTime={new Date(now).toISOString()}>{formatDateTime(now, undefined, locale)}</time>
    </div>
  ) : null;
}

export default function App() {
  const locale = useLocale();
  const [attempt, setAttempt] = useState(0);
  const [health, setHealth] = useState<Health>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setHealth(undefined);
    setFailed(false);
    request<Health>('health', { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) {
          setHealth(value);
          setServerClock(value.timestamp);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <main>
      <header className="intro">
        <div className="topline">
          <p className="eyebrow">React · Vite · NestJS</p>
          <nav aria-label="Language" className="languages">
            <button
              type="button"
              onClick={() => setLocale('zh-CN')}
              aria-pressed={locale === 'zh-CN'}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setLocale('en-US')}
              aria-pressed={locale === 'en-US'}
            >
              English
            </button>
          </nav>
        </div>
        <h1>__PROJECT_NAME__</h1>
        <p className="tagline">{t('app.tagline')}</p>
        <div className="connection-row">
          <div className="status" role="status" aria-live="polite">
            <p>
              {failed ? t('status.failed') : health ? t('status.connected') : t('status.loading')}
            </p>
            {health && (
              <p className="service-name">
                {health.service} · {health.environment}
              </p>
            )}
          </div>
          <button className="retry" type="button" onClick={() => setAttempt((value) => value + 1)}>
            {t('status.retry')}
          </button>
        </div>
        <ServerTime />
      </header>
      <ReusableExamples />
    </main>
  );
}
