require('dotenv').config()

const express = require('express')
const subdomain = require('express-subdomain')
const app = express()

const apmRouter = require('./lib/apm-router')

const networks = JSON.parse(process.env.APMSERVE_NETWORKS)
const aliases = JSON.parse(process.env.APMSERVE_ALIASES || '[]')

app.use(require('cors')())
app.use(require('compression')())

// Always check hostname
app.use((req, res, next) => {
  req._basehost = process.env.APMSERVE_HOST

  if (req.hostname.indexOf(req._basehost) === -1) {
    const { target } = aliases.find(({ alias }) => req.hostname === alias) || {}
    if (target) {
      req.headers.host = `${target}.${req._basehost}`
    } else {
      return next(new Error('Incorrect HOST name, please set HOST env variable correctly'))
    }
  }
  next()
})

const routers = networks.map(({ network, sub }) => {
  return subdomain(sub || `*.${network}`, apmRouter(network))
})

app.set("subdomain offset", process.env.APMSERVE_HOST.split('.').length)
routers.forEach(router => app.use(router))

app.use(function (req, res, next) {
  res.status(404).send('Not found. Maybe you are looking for https://aragon.rinkeby.aragonpm.com')
})

// Error handler
app.use(function (err, req, res, next) {
  console.error('Error', err)
  res.status(503).send({ error: err.message })
})

const port = process.env.PORT || 3000
app.listen(port, (err) => {
  if (err) return console.error(err)
  console.log(`Listening on port ${port} (host: ${process.env.APMSERVE_HOST})`)
})
