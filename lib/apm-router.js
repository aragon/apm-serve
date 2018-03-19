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
    const { content } = await apm.getLatestVersion(req.apmRepo)
    const uri = `${content.provider}:${content.location}`
    const path = req.path === '/' ? 'index.html' : req.path

    // needed because `end` is emitted before `error` always
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
