require('dotenv').config()

const subdomain = require('express-subdomain')
const express = require('express')
const app = express()

const apmRouter = require('./lib/apm-router')

const networks = JSON.parse(process.env.APMSERVE_NETWORKS)

app.use(require('cors')())

// Always check hostname
app.use((req, res, next) => {
  req.basehost = process.env.APMSERVE_HOST

  if (req.hostname.indexOf(req.basehost) === -1) {
    return next(new Error('Incorrect HOST name, please set HOST env variable correctly'))
  }
  next()
})

const routers = networks.map(({ network, sub }) => {
  return subdomain(sub || `*.${network}`, apmRouter(network))
})

routers.forEach(router => app.use(router))

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
