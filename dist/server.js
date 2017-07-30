"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var node_fetch_1 = require("node-fetch");
var cors = require("cors");
var handleResponse = function (response) {
    return response.json()
        .then(function (json) {
        if (!response.ok) {
            throw new Error(json.message || json.ErrorDescription || JSON.stringify(json));
        }
        return json;
    });
};
var handleError = function (res) { return function (e) { return res.status(500).send({ message: e.message }); }; };
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send("VSTS: Speech-to-Task API is running.  Time: " + (new Date()).toJSON());
});
app.get('/vars', function (req, res) {
    res
        .header("Content-Type", 'application/json')
        .send(JSON.stringify(process.env, null, '  '));
});
app.post('/token', function (req, res) {
    var redirectUri = encodeURIComponent(req.body.redirectUri);
    var clientSecret = process.env.vstsClientSecret;
    if (typeof clientSecret !== 'string') {
        res.status(500).send({ message: 'Server does not have client secret needed to acquire token' });
        return;
    }
    var assertion = req.body.authorizationCode ? req.body.authorizationCode : req.body.refreshToken;
    var grantType = req.body.authorizationCode ? 'urn:ietf:params:oauth:grant-type:jwt-bearer' : 'refresh_token';
    node_fetch_1.default('https://app.vssps.visualstudio.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=" + clientSecret + "&grant_type=" + grantType + "&assertion=" + assertion + "&redirect_uri=" + redirectUri
    })
        .then(function (r) { return handleResponse(r); })
        .then(function (json) {
        res.send(json);
    })
        .catch(handleError(res));
});
app.post('/cognitiveservicestoken', function (req, res) {
    var subscriptionKey = process.env.bingSpeechApiPrimaryKey;
    if (typeof subscriptionKey !== 'string') {
        res.status(500).send({ message: 'Server does not have Bing Speech API subscription key needed to acquire token. Contact administrator.' });
        return;
    }
    node_fetch_1.default("https://api.cognitive.microsoft.com/sts/v1.0/issueToken?Subscription-key=" + subscriptionKey, {
        method: 'POST'
    })
        .then(function (r) { return r.text(); })
        .then(function (token) {
        res.status(200).send({ token: token });
    })
        .catch(handleError(res));
});
var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Example app listening on port 3000!');
});
//# sourceMappingURL=server.js.map