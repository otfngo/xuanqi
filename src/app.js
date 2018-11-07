const http = require('http')
const path = require('path')
const fs =  require('fs')
const fsPromises = fs.promises
const defaultConfig = require('./config')
const chalk = require('chalk')
const compress = require('../utils/compress')
const isFresh = require('../utils/cache')

const handlebars = require('handlebars')
const template = path.join(__dirname, './template.html')
const source = fs.readFileSync(template)
const tpl = handlebars.compile(source.toString())

const mimeMap = new Map([
  ['.css', 'text/css;charset=utf-8'],
  ['.html', 'text/html;charset=utf-8'],
  ['.js', 'application/javascript;charset=utf-8'],
  ['.json', 'application/json;charset=utf-8'],
  ['default', 'text/plain;charset=utf-8']
])

async function doStat({req, res, filePath, config}) {
  try {
    const stat = await fsPromises.stat(filePath)
    if (stat.isFile()) {
      doFile({req, res, filePath, stat})
    } else if (stat.isDirectory()) {
      doDirectory({res, filePath, config})
    }
  } catch (err) {
    res.statusCode = 404
    res.setHeader('Content-Type', mimeMap.get('default'))
    res.end(`${filePath} is not a directory or file`)
  }
}

async function doFile({req, res, filePath, stat}) {
  try {
    res.statusCode = 200
    res.setHeader('Content-Type', mimeMap.get(path.extname(filePath)) || mimeMap.get('default'))

    if (isFresh(stat, req, res)) {
      res.statusCode = 304
      res.end()
      return
    }

    const rs = fs.createReadStream(filePath)
    compress(rs, req, res)
  } catch (err) {
    res.statusCode = 503
    res.setHeader('Content-Type', mimeMap.get('default'))
    res.end(`read file ${filePath} failure`)
  }
}

async function doDirectory({res, filePath, config}) {
  try {
    const files = await fsPromises.readdir(filePath)
    res.statusCode = 200
    res.setHeader('Content-Type', mimeMap.get('.html'))
    const url = path.relative(config.root, filePath)
    const data = {
      files,
      dir: url ? `/${url}` : ''
    }
    res.end(tpl(data))
  } catch (error) {
    res.statusCode = 503
    res.setHeader('Content-Type', mimeMap.get('default'))
    res.end(`read directory ${filePath} failure`)
  }
}

class Server {
  constructor(config) {
    this.config = Object.assign({}, defaultConfig, config)
  }
  start() {
    const server = http.createServer((req, res) => {
      const filePath = path.join(this.config.root, req.url)
      const config = this.config
      doStat({req, res, filePath, config})
    })
    
    server.listen(this.config.port, this.config.hostname, () => {
      const addr = `http://${this.config.hostname}:${this.config.port}`
      console.info(`Server running at ${chalk.green(addr)}`)
    })
  }
}

module.exports = Server