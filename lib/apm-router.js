const express = require('express')
const APM = require('@aragon/apm')
const Web3 = require('web3')

module.exports = network => {
  const router = express.Router()

  const getEnv = key => process.env[`apmserve_${network}_${key}`.toUpperCase()]

  const ipfs = { rpc: { host: getEnv('ipfs') || 'localhost' } }
  const ensRegistryAddress = getEnv('ens') || '0xaa0ccb537289d226941745c4dd7a819a750897d0'

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
    const { content } = await apm.getLatestVersion(req.apmRepo)
    const uri = `${content.provider}:${content.location}`
    
    // Determine mime-type
    const path = req.path === '/' ? 'index.html' : req.path
    const type = path.split('.').pop()
    res.type(type)

    // Needed because `end` is emitted before `error` always
    let didSendData = false

    const fileStream = apm.getFileStream(uri, path)
    fileStream.on('error', (error) => {
      console.error(error)
      res.status(503).send({ error: error.message })
      fileStream.destroy()
    })
    fileStream.on('data', (chunk) => {
      didSendData = true
      res.write(chunk)
    })
    fileStream.on('end', () => {
      if (didSendData) res.end()
    })
  })

  return router
}
