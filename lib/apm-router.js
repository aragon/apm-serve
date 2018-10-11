const express = require('express')
const APM = require('@aragon/apm')
const Web3 = require('web3')

module.exports = network => {
  const router = express.Router()

  const getEnv = key => (
    process.env[`apmserve_${network}_${key}`.toUpperCase()] ||
    process.env[`apmserve_${key}`.toUpperCase()]
  )

  const ipfs = { gateway: getEnv('ipfs') }
  const ensRegistryAddress = getEnv('ens')

  const web3 = new Web3(getEnv('eth'))

  const apm = APM(web3, { ipfs, ensRegistryAddress })

  router.use((req, res, next) => {
    req.apmRepo = req.hostname
      .replace(req.basehost, '')
      .replace(`${network}.`, '')
      .concat(getEnv('apm'))
    next()
  })

  router.get('*', async (req, res, next) => {
    const { content } = await apm.getLatestVersion(req.apmRepo)
    const uri = `${content.provider}:${content.location}`

    // Determine mime-type
    const path = req.path === '/' ? 'index.html' : req.path
    const type = path.split('.').pop()
    res.type(type)

    // Needed because `end` is emitted before `error` always
    let didSendData = false

    let fileStream
    try {
      fileStream = await apm.getFileStream(uri, path)
    } catch (error) {
      next(error)
      return
    }

    fileStream.on('error', (error) => {
      next(error)
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
