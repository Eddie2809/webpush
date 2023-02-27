const express = require("express");
const webpush = require("web-push");
const bodyparser = require("body-parser");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(".data/db.json");
const db = low(adapter);
const vapidDetails = {
  publicKey: "BLWyIBhNPxf7eL1656H9kTFca9Zp4Zdq5nihLvAgiQlfJri-x3Q2obS_08cyKCK-qPHyzExmcpJTNYwHDHzw_a4",
  privateKey: "WjqpH_dR979AhylIowErmHe9RE9EWKWZ4uPRtGURC74",
  subject: "mailto:190300377@ucaribe.edu.mx"
};

db.defaults({
  subscriptions: [],
}).write();

function sendNotifications(subscriptions,msg) {
  // Create the notification content.
  const notification = JSON.stringify({
    title: msg,
    options: {
      body: `ID: ${Math.floor(Math.random() * 100)}`
    }
  });
  // Customize how the push service should attempt to deliver the push message.
  // And provide authentication information.
  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails
  };
  // Send a push message to each client specified in the subscriptions array.
  subscriptions.forEach(subscription => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substr((endpoint.length - 8), endpoint.length);
    webpush.sendNotification(subscription, notification, options)
      .then(result => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Result: ${result.statusCode}`);
      })
      .catch(error => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Error: ${error} `);
      });
  });
}

const app = express();
app.use(bodyparser.json());
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}))

app.post("/add-subscription", (request, response) => {
    console.log(`Subscribing ${request.body.endpoint}`);
    db.get('subscriptions')
     .push(request.body)
     .write();
    response.sendStatus(200);
});

app.post("/remove-subscription", (request, response) => {
  console.log(`Unsubscribing ${request.body.endpoint}`);
  db.get('subscriptions')
    .remove({endpoint: request.body.endpoint})
    .write();
  response.sendStatus(200);
});

app.post("/notify-me", (request, response) => {
  console.log(`Notifying ${request.body.endpoint}`);
  const subscription = 
      db.get('subscriptions').find({endpoint: request.body.endpoint}).value();
  sendNotifications([subscription],'Prueba de notify me');
  response.sendStatus(200);
});

app.post("/notify-all", (request, response) => {
  console.log('Notifying all subscribers');
  const subscriptions =
      db.get('subscriptions').cloneDeep().value();
  if (subscriptions.length > 0) {
    sendNotifications(subscriptions,'Prueba de notify all');
    response.sendStatus(200);
  } else {
    response.sendStatus(409);
  }
});

app.post('/notify-recognized-face',(req,res) => {
    let {name} = req.body
    let msg = 'Se reconoció a ' + name
    console.log('Notifying all subscribers');
    const subscriptions =
        db.get('subscriptions').cloneDeep().value();
    if (subscriptions.length > 0) {
        sendNotifications(subscriptions,msg);
        response.sendStatus(200);
    } else {
        response.sendStatus(409);
    }
})

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

const port = process.env.PORT
//const port = 3001

const listener = app.listen(port, () => {
  console.log(`Listening on port ${listener.address().port}`);
});
