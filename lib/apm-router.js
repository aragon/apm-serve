const express = require('express')
const APM = require('@aragon/apm')
const Web3 = require('web3')

module.exports = network => {
  const router = express.Router()

  const getEnv = key => process.env[`apmserve_${network}_${key}`.toUpperCase()]

  const ipfs = { rpc: { host: getEnv('ipfs') || 'localhost' } }
  const ensRegistryAddress = getEnv('ens') || '0xfbae32d1cde62858bc45f51efc8cc4fa1415447e'

  const web3 = new Web3(getEnv('eth') || `https://${network}.infura.io`)
  const apm = APM(web3, { ipfs, ensRegistryAddress })

  router.use((req, res, next) => {
    req.apmRepo = req.hostname
      .replace(req.basehost, '')
      .replace(`${network}.`, '')
      .concat(getEnv('apm') || 'aragonpm.eth')
    next()
  })

  router.get('*', async (req, res) => {
    try {
      const { content } = await apm.getLatestVersion(req.apmRepo)
      const uri = `${content.provider}:${content.location}`
      const f = await apm.getFile(uri, req.path != '/' ? req.path : 'index.html')
      res.send(f)
    } catch (error) {
      console.error(error)
      res.status(503).send({ error: error.message })
    }
  })

  return router
}
