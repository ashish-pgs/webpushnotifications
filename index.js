var express = require('express');
var app = express();
var routes = require('./routes');
var bodyParser = require('body-parser')
const webpush = require('web-push');
var MongoClient = require("mongodb");

const vapidKeys = {
  publicKey:
  'BFxJHOL11hXZ6FlS27GI9R4idwWeT0R4QDlBeVLzculimGR9UE52iDKUn02-ez8-4ZFl5f2DqO-M19K8J_deYLc',
  privateKey: 'mGHsTXQtXl2BSEMaZb3ZM01rfWMTNL9yfIWYmULtxS4'
};

var MONGOLAB_URI = "mongodb://test:test123@ds233452.mlab.com:33452/subscription-datastore";

const path = require('path');
const PORT = process.env.PORT || 5000
app.get('/ashish', function (req, res) {
   res.send('Hello World');
})

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.get('/', function(req,res){
	console.log(__dirname);
	console.log('Inside app.get method');
	res.sendFile('index.html');
	console.log('sharma');
})

function savetoMongoDB(body) {


  MongoClient.connect(MONGOLAB_URI, function(err, db){
  if(err){
    console.log(err);
  }
  const myAwesomeDB = db.db('subscription-datastore');


  console.log(body.subscription);
  console.log(body.userPreferences);
  var data = body.subscription;
  var userPreferences = body.userPreferences;

  var objectId;
 myAwesomeDB.collection('Subscription').insertOne(data, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    console.log("object id - " , data._id);
    objectId = data._id;

console.log("objectId - " , objectId);
 var newData = {ref_id : objectId, userPreferences:userPreferences};
  console.log("new data - " , newData);
 myAwesomeDB.collection('UserPreferences').insertOne(newData, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    console.log("object id - " , data._id);
    objectId = data._id;
    db.close();
  });


  });



});
 // res.send(JSON.stringify({ data: { success: true } }));

}


function saveSubscriptionToDatabase(body) {
  savetoMongoDB(body);
  console.log('subscription received5689', body);
 
}

const triggerPushMsg = function(subscription, dataToSend) {
  console.log('Data to send', dataToSend);
  return webpush.sendNotification(subscription, dataToSend)
  .then(function abc(){
    console.log('data successfully sent to push message services');
  })
  .catch((err) => {
    if (err.statusCode === 410) {
     // return deleteSubscriptionFromDatabase(subscription._id);
    } else {
      console.log('Subscription is no longer valid: ', err);
    }
  });
};

function retrievefromDB() {
   MongoClient.connect(MONGOLAB_URI, function(err, db){
  if(err){
    console.log(err);
  }
  const myAwesomeDB = db.db('subscription-datastore');

  console.log('Inside retrieve DB');
 // var cursor  = collection('Subscription').find();

  var cursor = myAwesomeDB.collection('Subscription').find({});
  cursor.each(function(err, doc){
    if(doc){
      console.log("finding data");
      console.log(doc);
      triggerPushMsg(doc, 'Test Dataasd');
    console.log("data found");
    }
  });
 /* myAwesomeDB.collection('Subscription').find({}, function(err, res) {
    if (err) throw err;
    console.log(res);
    console.log('got results');
    db.close();
  });*/
});
}

function retrievefromDBBasedOn(req) {
   MongoClient.connect(MONGOLAB_URI, function(err, db){
  if(err){
    console.log(err);
  }
  const myAwesomeDB = db.db('subscription-datastore');

  console.log('Inside retrieve DB');
  console.log(req.category);
  var cursor = myAwesomeDB.collection('UserPreferences').find({"userPreferences.categories" : {"$in": [req.category]}});
  cursor.each(function(err, doc){
    if(doc){
      console.log("finding data");
      
      // var data = JSON.parse(JSON.stringify(doc));
      // console.log("Sending message to " + doc);
      console.log(doc.ref_id);
      // var subscription;
      // if(doc.subscription){
        // subscription = doc.subscription;
        // triggerPushMsg(doc, req.message);
      // }
      var cursor = myAwesomeDB.collection('Subscription').find({"_id" : {"$in": [doc.ref_id]}});
  cursor.each(function(err, doc){
    if(doc){
console.log("finding data");
console.log("data" , doc);
triggerPushMsg(doc, req.message);
}
});
    console.log("data found");
    }
  });
 /* myAwesomeDB.collection('Subscription').find({}, function(err, res) {
    if (err) throw err;
    console.log(res);
    console.log('got results');
    db.close();
  });*/
});
}


app.post('/api/send-subscription/', function (req, res) {

   webpush.setVapidDetails(
  'mailto:ashishrsharma2@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);
  
  retrievefromDB();
   res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ data: { success: true } }));
  return 123;  
});

app.post('/api/send-notification/', function (req, res) {

   webpush.setVapidDetails(
  'mailto:ashishrsharma2@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);
  
  var reqbody = req.body;
  console.log(reqbody.appid);

  retrievefromDBBasedOn(reqbody);
   res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ data: { success: true } }));
  return 123;  
});
  
app.post('/api/save-subscription/', function (req, res) {
  console.log('Inside save subscription2');
  saveSubscriptionToDatabase(req.body);

    res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ data: { success: true } }));

 // res.send(JSON.stringify({ data: { success: true } }));
 /* return routes.saveSubscriptionToDatabase(req.body)
  .then(function(subscriptionId) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ data: { success: true } }));
  })
  .catch(function(err) {
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      error: {
        id: 'unable-to-save-subscription',
        message: 'The subscription was received but we were unable to save it to our database.'
      }
    }));
  });*/
});
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));


