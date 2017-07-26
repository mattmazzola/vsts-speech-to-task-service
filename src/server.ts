import * as express from 'express'
import * as bodyParser from 'body-parser'
import fetch from 'node-fetch'

const app = express()

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send(`VSTS: Speech-to-Task API is running.  Time: ${(new Date()).toJSON()}`)
})

app.get('/vars', (req, res) => {
    res.send(JSON.stringify(process.env, null, '  '))
})

app.post('/token', (req, res) => {
    const authorizationCode = req.body.authorizationCode
    const redirectUri = req.body.redirectUri
    const appSecret = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs'

    return fetch('https://app.vssps.visualstudio.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${appSecret}&grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${authorizationCode}&redirect_uri=${redirectUri}`
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText)
            }
        })
        .then(json => {
            res.send(json)
        })
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log('Example app listening on port 3000!')
})