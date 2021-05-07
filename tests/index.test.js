const { serverless } = require('../')
const sign = require('@octokit/webhooks/sign')

describe('serverless-gcf', () => {
  let spy, handler, response

  beforeEach(() => {
    response = { send: jest.fn(), sendStatus: jest.fn() }
    spy = jest.fn()
    handler = serverless(async app => {
      app.auth = () => Promise.resolve({})
      app.on('issues', spy)
    })
  })
  afterEach(() => {
    process.env.WEBHOOK_SECRET = ''
  })

  it('responds with the homepage', async () => {
    const request = { method: 'GET', path: '/probot' }
    await handler(request, response)
    expect(response.send).toHaveBeenCalled()
    expect(response.send.mock.calls[0][0]).toMatchSnapshot()
  })

  it('calls the event handler', async () => {
    process.env.WEBHOOK_SECRET = 'secret'
    const body = {
      installation: { id: 1 }
    }
    const signature = sign('secret', body)
    const request = {
      body,
      get (string) {
        return this[string]
      },
      'x-github-event': 'issues',
      'x-github-delivery': 123,
      'x-hub-signature': signature
    }

    await handler(request, response)
    expect(response.send).toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
  })

  it('does nothing if there are missing headers', async () => {
    process.env.WEBHOOK_SECRET = 'secret'
    const request = {
      body: {
        installation: { id: 1 }
      },
      get (string) {
        return this[string]
      }
    }

    await handler(request, response)
    expect(response.send).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    expect(response.sendStatus).toHaveBeenCalledWith(400)
  })

  it('does not allow invalid signatures', async () => {
    process.env.WEBHOOK_SECRET = 'secret'
    const body = {
      installation: { id: 1 }
    }
    const signature = sign('wrong_secret', body)
    const request = {
      body,
      get (string) {
        return this[string]
      },
      'x-github-event': 'issues',
      'x-github-delivery': 123,
      'x-hub-signature': signature
    }

    await handler(request, response)
    expect(response.send).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    expect(response.sendStatus).toHaveBeenCalledWith(400)
  })

  it('requires the secret to be set', async () => {
    const body = {
      installation: { id: 1 }
    }
    const request = {
      body,
      get (string) {
        return this[string]
      },
      'x-github-event': 'issues',
      'x-github-delivery': 123
    }

    await handler(request, response)
    expect(response.send).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    expect(response.sendStatus).toHaveBeenCalledWith(500)
  })

  it('requires a signature', async () => {
    process.env.WEBHOOK_SECRET = 'secret'
    const body = {
      installation: { id: 1 }
    }
    const request = {
      body,
      get (string) {
        return this[string]
      },
      'x-github-event': 'issues',
      'x-github-delivery': 123
    }

    await handler(request, response)
    expect(response.send).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    expect(response.sendStatus).toHaveBeenCalledWith(400)
  })
})
