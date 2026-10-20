import { useCallback, useState } from 'react';
import { LineChart } from '../components/LineChart';
import { AsyncSearchSelect, type SearchOption } from '../components/AsyncSearchSelect';
import { t, useLocale } from '../lib/i18n/translator';

const points = [12, 18, null, 15, 23, 17, 25, 21].map((value, index) => ({
  label: String(index + 1).padStart(2, '0'),
  value,
}));

export function ReusableExamples() {
  const locale = useLocale();
  const [selected, setSelected] = useState<SearchOption | null>(null);
  const loadOptions = useCallback(
    async (query: string, signal: AbortSignal): Promise<SearchOption[]> => {
      signal.throwIfAborted();
      const options = [
        { id: 'react', label: 'React', description: t('search.react') },
        { id: 'vite', label: 'Vite', description: t('search.vite') },
        { id: 'nestjs', label: 'NestJS', description: t('search.nest') },
      ];
      return options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()));
    },
    [locale],
  );
  return (
    <section className="examples" aria-labelledby="examples-title">
      <div className="examples-heading">
        <h2 id="examples-title">{t('examples.title')}</h2>
        <p>{t('examples.caption')}</p>
      </div>
      <div className="example-card">
        <LineChart
          data={points}
          title={t('chart.title')}
          unit={t('chart.unit')}
          emptyText={t('chart.empty')}
          formatValue={(value) =>
            new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
          }
        />
      </div>
      <div className="example-card search-example">
        <AsyncSearchSelect
          key={locale}
          label={t('search.label')}
          value={selected}
          onChange={setSelected}
          loadOptions={loadOptions}
          placeholder={t('search.placeholder')}
          messages={{
            loading: t('search.loading'),
            error: t('search.error'),
            empty: t('search.empty'),
            clear: t('search.clear'),
          }}
        />
        <p className="selection" role="status">
          {selected ? t('search.selected', { name: selected.label }) : t('search.none')}
        </p>
      </div>
    </section>
  );
}
