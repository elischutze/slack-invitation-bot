var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var config = require('./config')
var Promise = require('promise')
var path = require('path')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(path.join(__dirname, '/public')))
app.use(bodyParser.urlencoded({
  extended: true
}))

function sendWebhook (url, body) {
  var options = {
    url: url,
    body: body,
    json: true
  }
  request.post(options, function (err, res, body) {
    if (err) {
      console.log('error!%')
    } else {
      console.log('webhooked!')
    }
  })
}

function inviteToSlack (person) {
  return new Promise(function (resolve, reject) {
    var url = 'https://slack.com/api/users.admin.invite?token=' + config.token
    var options = {
      url: url,
      body: {
        email: person.email + '',
        channels: 'C3CF5TED6,C4B0XAMQD,C4A7T14U9',
        first_name: person.first && '',
        last_name: person.last && ''
      },
      json: true
    }
    request.post(options, function (err, res, body) {
      if (err) {
        console.log('posterr:', err)
        resolve('error')
      }
      if (res.statusCode === 200) {
        if (res.body.ok) {
          console.log('code:', res.statusCode, res.body)
          sendWebhook(config.webhook,
            {'text': 'Testing!\nIt worked!\nInvite sent to: ' +
            person.first + ' ' +
            person.last + '<' + person.email + '>'})
          resolve('success')
        } else {
          console.log('code:', res.statusCode, res.body)
          sendWebhook(config.webhook, {'text': 'Testing!\nSomething went wrong..\nError: ' + res.body.error})
          resolve('error')
        }
      } else {
        sendWebhook(config.webhook, {'text': 'Testing!\nSomething went wrong..\nStatus:' + res.statusCode})
        resolve('error')
      }
    }
  )
  }
)
};

app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, '/public/index.html'))
})
app.get('/error', function (request, response) {
  response.sendFile(path.join(__dirname, 'public/error.html'))
})
app.get('/success', function (request, response) {
  response.sendFile(path.join(__dirname, '/public/success.html'))
})

app.post('/submit', function (req, res) {
  console.log(req.body)
  inviteToSlack({email: decodeURI(req.body.email), first: req.body.fname, last: req.body.lname})
  .then(function (result) {
    res.redirect('/' + result)
  })
}
)

app.get('/send', function (req, res) {
  request.post(config.webhook,
    {json: true, body: { 'text': 'i am integr8' }},
    function (err, res, body) {
      if (err) {
        console.log('err in fake send')
      }
      console.log('bod:', body)
    }
  )
  res.send('sent..')
}
)

app.listen(app.get('port'), function () {
  console.log('Node app is running at localhost:' + app.get('port'))
})
