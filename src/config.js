module.exports = {
  root: process.cwd(),
  hostname: '127.0.0.1',
  port: 8080,
  compress: /\.(html|js|txt|css|md|json)/,
  cache: {
    maxAge: 600,
    expires: true,
    cacheControl: true,
    lastModified: true,
    etag: true
  }
}