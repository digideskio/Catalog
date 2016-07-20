var path = __dirname;
var PORT = process.env.PORT || 3000;
var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var serverOps = require(path + "/serverOps.js");
var public_serverOps = require(path + "/static/app/components/googlesheets/public_gapi.js");

app.use(bodyParser.json());
app.use(express.static(path + '/static'));
app.use('/', router);

router.get("/", function (req, res) {
    res.sendFile(path + '/static/views/index.html');
    console.log()
});

router.get("/input", function (req, res) {
    res.sendFile(path + '/static/views/input.html');
});

router.post("/new", function (req, res) {
    serverOps.parse(req.body[0], req.body[1], function (response) {
        return res.json(response);
    });
});

router.post("/delete", function (req, res) {
    serverOps.delEntry(req.body[0], function (result) {
        return res.json(result);
    });
});

router.get("/getCatalog", function (req, res) {
    serverOps.getData(function (result) {
        return res.json(result);
    });
});

router.get("/publicGetCatalog", function (req, res) {
    public_serverOps.public_getDataList(function (result) {
        return res.json(result);
    });
});

app.listen(PORT, function () {
    console.log("Live at Port 3000");
});
