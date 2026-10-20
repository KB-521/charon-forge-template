import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-sm text-accent">404 / Page not found</p>
      <h1 className="mb-4 mt-2 font-serif text-5xl font-normal">A wrong turn.</h1>
      <p className="mb-8 leading-7 text-ink/65">The page you are looking for does not exist.</p>
      <Link href="/" className="w-fit text-ink underline underline-offset-4 hover:text-accent">
        Back to the start →
      </Link>
    </main>
  )
}
