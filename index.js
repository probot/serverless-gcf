const { Application } = require('probot')
const { resolve } = require('probot/lib/resolver')
const { findPrivateKey } = require('probot/lib/private-key')
const { template } = require('./views/probot')
const cacheManager = require('cache-manager')

let app, probot, cache

const loadProbot = (plugin) => {
  cache = cache || cacheManager.caching({
    store: 'memory',
    ttl: 60 * 5 // 5 minutes
  })

  app = app || new Application({
    id: process.env.APP_ID,
    secret: process.env.WEBHOOK_SECRET,
    cert: findPrivateKey(),
    cache
  })

  if (typeof plugin === 'string') {
    plugin = resolve(plugin)
  }

  app.load(plugin)

  return app
}

module.exports.serverless = appFn => {
  return async (request, response) => {
    // 🤖 A friendly homepage if there isn't a payload
    if (request.method === 'GET' && request.path === '/probot') {
      return response.send({
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: template
      })
    }

    // Otherwise let's listen handle the payload
    probot = probot || loadProbot(appFn)

    // Determine incoming webhook event type
    const event = request.get('x-github-event') || request.get('X-GitHub-Event')
    const id = request.get('x-github-delivery') || request.get('X-GitHub-Delivery')

    // Do the thing
    console.log(`Received event ${event}${request.body.action ? ('.' + request.body.action) : ''}`)
    if (event) {
      try {
        await probot.receive({
          event,
          id,
          payload: request.body
        })
        response.send({
          statusCode: 200,
          body: JSON.stringify({ message: 'Executed' })
        })
      } catch (err) {
        console.error(err)
        response.send({
          statusCode: 500,
          body: JSON.stringify({ message: err })
        })
      }
    } else {
      console.error(request)
      response.sendStatus(400)
    }
  }
}
