import StarterAction from '@/components/starter-action'

const stack = ['Next.js', 'TypeScript', 'Tailwind CSS', 'Ant Design']

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 sm:px-12">
      <header className="flex items-center justify-between border-0 border-b border-solid border-ink/15 py-7">
        <span className="text-sm font-semibold tracking-tight">Next.js Starter</span>
        <span className="font-mono text-xs text-ink/60">01 / A fresh start</span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-20 sm:py-28">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Make something of your own
        </p>
        <h1 className="m-0 max-w-3xl font-serif text-6xl font-normal leading-[1.02] tracking-[-0.045em] sm:text-8xl">
          Your next project
          <br />
          starts here
          <span className="text-accent">.</span>
        </h1>
        <p className="mb-8 mt-7 max-w-md text-base leading-7 text-ink/65">
          A simple foundation. A little structure. Plenty of room for your ideas.
        </p>
        <div>
          <StarterAction />
        </div>
        <ul className="mb-0 mt-12 flex list-none flex-wrap gap-x-6 gap-y-3 p-0">
          {stack.map(name => (
            <li key={name} className="text-xs text-ink/60">
              {name}
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-col gap-4 border-0 border-t border-solid border-ink/15 py-7 text-xs text-ink/60 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Start with
          {' '}
          <code className="text-ink">src/app/page.tsx</code>
        </span>
        <a
          className="w-fit text-ink underline decoration-ink/30 underline-offset-4 hover:text-accent"
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noreferrer"
        >
          Read the documentation ↗
        </a>
      </footer>
    </main>
  )
}
