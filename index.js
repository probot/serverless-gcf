const createProbot = require('probot');
const { resolve } = require('probot/lib/resolver')
const { findPrivateKey } = require('probot/lib/private-key')
const { template } = require('./views/probot')

const loadProbot = (plugin) => {
  const probot = createProbot({
    id: process.env.APP_ID,
    secret: process.env.WEBHOOK_SECRET,
    cert: findPrivateKey()
  })

  if (typeof plugin === 'string') {
    plugin = resolve(plugin)
  }

  probot.load(plugin)

  return probot
}


module.exports.serverless = (plugin) => {

  return async (event, context) => {

    // 🤖 A friendly homepage if there isn't a payload
    if (event.httpMethod === 'GET' && event.path === '/probot') {
      const res = {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html'
        },
        body: template
      }
      return context.done(null, res)
    }

    // Otherwise let's listen handle the payload
    const probot = loadProbot(plugin)

    // Ends function immediately after callback
    context.callbackWaitsForEmptyEventLoop = false

    // Determine incoming webhook event type
    const e = request.get('x-github-event') || request.get('X-GitHub-Event')
    const id = request.get('x-github-delivery') || request.get('X-GitHub-Delivery')

    // Do the thing
    console.log(`Received event ${event}${request.body.action ? ('.' + request.body.action) : ''}`)
    if (event) {
      try {
        probot.receive({
          event: event,
          id: id,
          payload: request.body
        }).then(() => {
          response.send({
            statusCode: 200,
            body: JSON.stringify({ message: 'Executed' })
          })
        })
      } catch (err) {
        console.error(err)
        response.send({
          statusCode: 500,
          body: JSON.stringify({
            message: err
          })
        })
      }
    } else {
      console.error(request)
      callback('unknown error')
    }
  }

}
