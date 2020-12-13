const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const logger = require('morgan');
const challenge1 = require('./challenge1.js');
const challenge2 = require('./challenge2.js');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(logger('dev'));

const port = process.env.PORT || 3000;

// Test Route
app.get('/', function (req, res) {
    res.json({
        status: 'success',
        message: "Off White Team: Works like magic"
    });
});

// Challenge 1
app.post('/challenge1', function (req, res) {
    const response = challenge1.process(req.body);
    res.json(response);
});

// Challenge 2
app.post('/challenge2', function (req, res) {
    const response = challenge2.process(req.body);
    res.json(response);
});

app.use((req, res, next) => {
    res
        .json({
            status: 'error',
            message: `The route ${req.originalUrl} does not exist on this server`
        })
        .status(404)
        .end();
})

app.use((err, req, res, next) => {
    console.log(err);
    res
        .json({
            status: 'error',
            message: `Internal server error`
        })
        .status(500)
        .end();
})

const server =  app.listen(port, () => {
    console.log(`app is listening on port ${port}`);
});

