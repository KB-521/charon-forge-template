import { useEffect, useId, useRef, useState } from 'react';
import styles from './index.module.css';

export interface SearchOption {
  id: string;
  label: string;
  description?: string;
}
export interface SearchMessages {
  loading: string;
  error: string;
  empty: string;
  clear: string;
}
export interface AsyncSearchSelectProps<T extends SearchOption> {
  label: string;
  value: T | null;
  onChange: (option: T | null) => void;
  loadOptions: (query: string, signal: AbortSignal) => Promise<readonly T[]>;
  placeholder?: string;
  messages?: Partial<SearchMessages>;
  debounceMs?: number;
  minLength?: number;
}

/** An asynchronous combobox: the loader owns data; this component owns cancellation and selection UI. */
export function AsyncSearchSelect<T extends SearchOption>({
  label,
  value,
  onChange,
  loadOptions,
  placeholder = '',
  messages,
  debounceMs = 250,
  minLength = 1,
}: AsyncSearchSelectProps<T>) {
  const text: SearchMessages = {
    loading: 'Loading…',
    error: 'Could not load results',
    empty: 'No results',
    clear: 'Clear selection',
    ...messages,
  };
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const loader = useRef(loadOptions);
  const pending = useRef<AbortController | undefined>(undefined);
  const sequence = useRef(0);
  const [query, setQuery] = useState(value?.label ?? '');
  const [options, setOptions] = useState<readonly T[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const listId = `${id}-list`;
  const show = open && query.trim().length >= Math.max(1, minLength);

  const cancel = () => {
    sequence.current++;
    pending.current?.abort();
    pending.current = undefined;
  };
  useEffect(() => {
    loader.current = loadOptions;
  }, [loadOptions]);
  useEffect(() => {
    setQuery(value?.label ?? '');
  }, [value?.id, value?.label]);
  useEffect(() => {
    const requestId = ++sequence.current;
    const controller = new AbortController();
    pending.current = controller;
    setActive(-1);
    setFailed(false);
    setOptions([]);
    if (!show) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    const timer = setTimeout(
      () => {
        Promise.resolve()
          .then(() => loader.current(query.trim(), controller.signal))
          .then((items) => {
            if (!controller.signal.aborted && requestId === sequence.current) setOptions(items);
          })
          .catch(() => {
            if (!controller.signal.aborted && requestId === sequence.current) setFailed(true);
          })
          .finally(() => {
            if (!controller.signal.aborted && requestId === sequence.current) setLoading(false);
          });
      },
      Math.max(0, debounceMs),
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, show, debounceMs, minLength]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        cancel();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => {
    if (active >= 0)
      document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const choose = (option: T) => {
    cancel();
    setQuery(option.label);
    setOpen(false);
    setActive(-1);
    onChange(option);
  };
  const status = loading ? text.loading : failed ? text.error : options.length ? '' : text.empty;
  return (
    <div
      className={styles.root}
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          cancel();
          setOpen(false);
        }
      }}
    >
      <label className={styles.label} htmlFor={`${id}-input`}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          ref={input}
          id={`${id}-input`}
          role="combobox"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls={show ? listId : undefined}
          aria-activedescendant={
            show && active >= 0 && options[active] ? `${listId}-${active}` : undefined
          }
          aria-describedby={show && status ? `${id}-status` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            cancel();
            setQuery(event.target.value);
            setOpen(true);
            setOptions([]);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              cancel();
              setOpen(false);
              setActive(-1);
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              setActive((index) =>
                options.length
                  ? index < 0
                    ? event.key === 'ArrowDown'
                      ? 0
                      : options.length - 1
                    : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
                      options.length
                  : -1,
              );
            }
            if (event.key === 'Enter' && show) {
              event.preventDefault();
              const option = options[active];
              if (option) choose(option);
            }
          }}
        />
        {query && (
          <button
            className={styles.clear}
            type="button"
            aria-label={text.clear}
            onClick={() => {
              cancel();
              setQuery('');
              setOptions([]);
              setActive(-1);
              setOpen(false);
              onChange(null);
              input.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>
      {show && (
        <div className={styles.popover}>
          {status && (
            <p className={styles.status} id={`${id}-status`} role={failed ? 'alert' : 'status'}>
              {status}
            </p>
          )}
          <ul
            className={styles.list}
            id={listId}
            role="listbox"
            aria-label={label}
            aria-busy={loading}
          >
            {options.map((option, index) => (
              <li
                className={`${styles.option} ${index === active ? styles.active : ''}`}
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={value?.id === option.id}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.description && <small>{option.description}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
