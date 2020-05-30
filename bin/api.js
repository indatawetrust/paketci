const express = require('express')
const router = express.Router()
const execa = require('execa');

module.exports = emitter => {

  router.put('/update', function (req, res) {
    const { name, newVersion } = req.body;
  
    execa('npm', ['i', `${name}@${newVersion}`])
    .then(({ stdout }) => {
      emitter.emit('updatePackage', { name, newVersion })

      res.json({
        stdout
      })
    })
    .catch(error => {
      res.json({
        error
      })
    })
  })
  
  router.post('/delete', function (req, res) {
    const { name } = req.body;
  
    execa('npm', ['un', name])
    .then(({ stdout }) => {
      emitter.emit('deletePackage', name)

      res.json({
        stdout
      })
    })
    .catch(error => {
      res.json({
        error
      })
    })
  })
  
  return router

}