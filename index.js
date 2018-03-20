const subdomain = require('express-subdomain')
const express = require('express')
const app = express()

const apmRouter = require('./lib/apm-router')

const networks = [
  // TODO: As soon as we start using mainnet we should require rinkeby to be prefixed
  { network: 'rinkeby', sub: '*' },
  // { network: 'ropsten' },
  // { network: 'kovan' },
  // { network: 'rpc' },
  // { network: 'mainnet', sub: '*' }, // wildcard, needs to be last
]

app.use(require('cors')())

// Always check hostname
app.use((req, res, next) => {
  req.basehost = process.env.HOST || 'aragonpm.test'

  if (req.hostname.indexOf(req.basehost) === -1) {
    return next(new Error('Incorrect HOST name, please set HOST env variable correctly'))
  }
  next()
})

const routers = networks.map(({ network, sub }) => {
  return subdomain(sub || `${network}.*`, apmRouter(network))
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
  console.log('Listening on port', port)
})
