const express = require('express')
const AV = require('leancloud-storage');
const { Query, User } = AV;
const app = express()
const port = 80

AV.init({
    appId: process.env.appId,
    appKey: process.env.appKey,
    serverURL: process.env.serverURL
});

const query = new AV.Query('likeCount');
const account = AV.Object.createWithoutData('likeCount', process.env.objectId);

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use('/static', express.static(__dirname + '/static'));
app.use('/demo', express.static(__dirname + '/demo'));

app.get('/', function getState(req,res){
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(__dirname + '/public/index.html');
})

app.get('/info', (req,res) => {
    query.find().then(function (results) {
        const data = {code: '200', msg: 'success', data: {count: results[0].attributes.count}}
        res.send(data);
    }
    ).catch(function (error) {
        const data = {code: '201', msg: 'error'}
        res.send(data);
    });
})

app.get('/like', (req, res) => {
45    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
46    const queryIP = new AV.Query('likeUser').equalTo('ip', ip);
47    queryIP.find().then(function (results) {
48        console.log(results)
49        if (results.length > 0) {
50            const data = {code: '201', msg: '你的爱意已经收到啦~', data: {count: '你的爱意已经收到啦~'}}
51            res.send(data);
52        } else {
53            const Like = AV.Object.extend('likeUser');
54            const like = new Like();
55            like.set('ip', ip);
56            const acl = new AV.ACL();
57            acl.setPublicReadAccess(true);
58            like.setACL(acl);
59            like.save().then((like) => {
60                account.increment('count', +1);
61                account.save(null, {
62                    query: new AV.Query('likeCount').greaterThanOrEqualTo('count', +1),fetchWhenSave: true
63                }).then((account) => {
64                    const data = {code: '200', msg: 'success', data: {count: account.attributes.count}}
65                    res.send(data);
66                }, (error) => {
67                    if (error.code === 305) {
68                        const data = {code: '201', msg: 'error'}
69                        res.send(data);
70                    }
71                });
72            }, (error) => {
73                console.error('Failed to create new object, with error message: ' + error.message);
74            });
75        }
76    }).catch(function (error) {
77        const data = {code: '201', msg: 'error'}
78        res.send(data);
79    });
80})

app.listen(port, () => {})
