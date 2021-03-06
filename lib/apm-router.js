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
    // e.g. voting.aragonpm.eth
    req.apmRepo = req.hostname
      .replace(req._basehost, '')
      .replace(`${network}.`, '')
      .concat(getEnv('apm'))
    next()
  })

  router.use(async (req, res, next) => {
    if (req.path === '/' && Object.keys(req.query).some(key => key === 'json')) {
      const versions = await apm.getAllVersions(req.apmRepo)
      res.send(versions)
    } else {
      next()
    }
  })

  router.get('*', async (req, res, next) => {
    let uri
    try {
      const { content } = await apm.getLatestVersion(req.apmRepo)
      uri = `${content.provider}:${content.location}`
    } catch (error) {
      res.status(404).send(`Error: Failed fetching latest version for APM repo '${req.apmRepo}' (${error.message})`)
      return
    }

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
