import * as express from 'express'
import * as bodyParser from 'body-parser'
import fetch from 'node-fetch'
import * as cors from 'cors'

const handleResponse = response => {
    return response.json()
        .then(json => {
            if (!response.ok) {
                throw new Error(json.message || json.ErrorDescription || JSON.stringify(json))
            }

            return json
        })
}

const handleError = res => e => res.status(500).send({ message: e.message })

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send(`VSTS: Speech-to-Task API is running.  Time: ${(new Date()).toJSON()}`)
})

app.get('/vars', (req, res) => {
    res
        .header("Content-Type", 'application/json')
        .send(JSON.stringify(process.env, null, '  '))
})

app.post('/token', (req, res) => {
    const redirectUri = encodeURIComponent(req.body.redirectUri)
    const clientSecret = process.env.vstsClientSecret
    if (typeof clientSecret !== 'string') {
        res.status(500).send({ message: 'Server does not have client secret needed to acquire token' })
        return;
    }

    const assertion = req.body.authorizationCode ? req.body.authorizationCode : req.body.refreshToken
    const grantType = req.body.authorizationCode ? 'urn:ietf:params:oauth:grant-type:jwt-bearer' : 'refresh_token'

    fetch('https://app.vssps.visualstudio.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${clientSecret}&grant_type=${grantType}&assertion=${assertion}&redirect_uri=${redirectUri}`
    })
        .then(r => handleResponse(r))
        .then(json => {
            res.send(json)
        })
        .catch(handleError(res))
})

app.post('/cognitiveservicestoken', (req, res) => {
    const subscriptionKey = process.env.bingSpeechApiPrimaryKey
    if (typeof subscriptionKey !== 'string') {
        res.status(500).send({ message: 'Server does not have Bing Speech API subscription key needed to acquire token. Contact administrator.' })
        return
    }

    fetch(`https://api.cognitive.microsoft.com/sts/v1.0/issueToken?Subscription-key=${subscriptionKey}`, {
        method: 'POST'
    })
        .then(r => r.text())
        .then(token => {
            res.status(200).send({ token })
        })
        .catch(handleError(res))
})

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log('Example app listening on port 3000!')
})