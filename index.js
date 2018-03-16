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

// Always check hostname
app.use((req, res, next) => {
  req.basehost = process.env.HOST || 'aragonpm.dev'

  if (req.hostname.indexOf(req.basehost) == -1) {
    console.log('[apm-serve] ERROR: please set correct HOST env variable')
    return res.status(500).send('Incorrect HOST name, please set HOST env var correctly')
  } else {
    next()
  }
})

const routers = networks.map(({ network, sub }) => {
  return subdomain(sub ? sub : `${network}.*`, apmRouter(network))
})

routers.forEach(router => app.use(router))

const port = process.env.PORT || 3000
app.listen(port, err => {
  if (err) return console.error(err)
  console.log('[apm-serve] up and running on port', port)
})
