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

app.get('/like', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    const queryIP = new AV.Query('likeUser').equalTo('ip', ip);

    try {
        const results = await queryIP.find();
        if (results.length > 0) {
            res.send({ code: '201', msg: '你的爱意已经收到啦~' });
        } else {
            const Like = AV.Object.extend('likeUser');
            const like = new Like();
            like.set('ip', ip);
            const acl = new AV.ACL();
            acl.setPublicReadAccess(true);
            like.setACL(acl);

            await like.save();

            const accountQuery = new AV.Query('likeCount'); // Assuming you have only one likeCount object
            let account = await accountQuery.first();

            if (!account) {
                account = new AV.Object('likeCount');
                account.set('count', 1);
            } else {
                account.increment('count');
            }

            await account.save();
            res.send({ code: '200', msg: 'success', data: { count: account.get('count') } });
        }
    } catch (error) {
        console.error('Error processing like:', error);
        res.status(500).send({ code: '201', msg: '服务器错误' }); // More informative error message
    }
});

app.listen(port, () => {})
