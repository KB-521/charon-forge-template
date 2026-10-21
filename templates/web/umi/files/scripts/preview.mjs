import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import process from 'node:process'

const root = resolve('dist')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
}
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    )
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      res.writeHead(404)
      res.end('No API server configured')
      return
    }
    let path = resolve(root, `.${pathname}`)
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403)
      res.end()
      return
    }
    const file = await stat(path).catch(() => undefined)
    if (file?.isDirectory())
      path = resolve(path, 'index.html')
    else if (!file && !extname(pathname))
      path = resolve(root, 'index.html')
    res.setHeader(
      'Content-Type',
      types[extname(path)] || 'application/octet-stream',
    )
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader(
      'Cache-Control',
      path.endsWith('runtime-config.js') ? 'no-store' : 'no-cache',
    )
    const data = await readFile(path)
    res.end(data)
  }
  catch {
    res.writeHead(404)
    res.end('Not found')
  }
})
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () =>
  console.log(`Preview http://127.0.0.1:${server.address().port}`))
