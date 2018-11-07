const { createGzip, createDeflate } = require('zlib')

module.exports = (rs, req, res) => {
  let acceptEncoding = req.headers['accept-encoding']
  if (!acceptEncoding) {
    acceptEncoding = ''
  }
  if (/\bgzip\b/.test(acceptEncoding)) {
    res.setHeader('Content-Encoding', 'gzip')
    rs.pipe(createGzip()).pipe(res)
  } else if (/\bdeflate\b/.test(acceptEncoding)) {
    res.setHeader('Content-Encoding', 'deflate')
    rs.pipe(createDeflate()).pipe(res)
  } else {
    rs.pipe(res)
  }
}