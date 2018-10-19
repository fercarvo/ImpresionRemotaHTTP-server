var createError = require('http-errors');
var express = require('express');
var debug = require('debug')('app:server');
var logger = require('morgan');
var index = require('./routes/index')
var { puerto_server } = require('./config_server.js')

var app = express();
var server = app.listen(puerto_server)

var io = require('socket.io')(server, {path: '/printer-connection'});
io.use(index.socketAuth)
io.on('connection', index.connectionCB)

server.on('error', onError);
server.on('listening', onListening);

// view engine setup
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', index.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;




function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof puerto_server === 'string'
      ? 'Pipe ' + puerto_server
      : 'Port ' + puerto_server;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
}