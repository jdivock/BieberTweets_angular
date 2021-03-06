/**
 * Module dependencies
 */
var express = require('express'),
    http = require('http'),
    twitter = require("twitter"),
    moment = require('moment'),
    path = require('path');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

// io.configure(function() {
// 	io.set("transports", ["xhr-polling"]);
// 	io.set("polling duration", 10);
// });

// all environments
app.set('port', process.env.PORT || 3000);
// app.set('views', __dirname + '/views');
// app.set('view engine', 'jade');

app.use(express.bodyParser());
app.use(express.methodOverride());
// app.use(express.static(path.join(__dirname, 'app')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
    app.use(express.logger('dev'));
    app.use(express.errorHandler());
    app.use(express.static(__dirname + "/app"));
    app.use(express.static(__dirname + "/app/bower_components/font-awesome"));
    app.use(express.static(__dirname + "/.tmp"));
}

// production only
if (app.get('env') === 'production') {
    // TODO
    app.use(express.static(__dirname + "/dist"));
};


/**
 * Routes
 */

// serve index and view partials
// app.get('/', routes.index);
// app.get('/partials/:name', routes.partials);

// // JSON API
// app.get('/api/name', api.name);

// // redirect all others to the index (HTML5 history)
// app.get('*', routes.index);

var twit = new twitter({
    consumer_key: process.env.TBT_CONSUMER_KEY,
    consumer_secret: process.env.TBT_CONSUMER_SECRET_KEY,
    access_token_key: process.env.TBT_ACCESS_TOKEN,
    access_token_secret: process.env.TBT_ACCESS_TOKEN_SECRET
});

function setupStream() {
    twit.stream('statuses/filter', {
        track: 'bieber'
    }, function(stream) {

        io.sockets.on('connection', function(socket) {

            stream.on('data', function(data) {
                var now = (new Date()).getTime();
                if (!data || !data.user) {
                    return;
                }

                

                var msg = {
                    text: data.text,
                    // htmlText: data.htmlText,
                    user_name: data.user.screen_name,
                    id: data.id_str,
                    author: '@' + data.user.screen_name,
                    added: now,
                    entities: data.entities,
                    timestamp: moment(now).format('MM/DD/YYYY, h:mm:ss a')
                };

                // console.log(data);

                socket.emit('tweet', msg);
            });

            stream.on('disconnect', setupStream);
            stream.on('end', setupStream);


        });
    });

};

setupStream();

/**
 * Start Server
 */

server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
