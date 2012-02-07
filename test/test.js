var sys = require('sys'),
	colors = require('colors'),
	xmpp = require('node-xmpp'),
	Client = require('../lib/xmpp-client').Client,
	conf = require('./conf').conf,
	http = require('http');

/*exports.testClientInit = function(test) {
	var c = new Client({jid: 'mathieu@gtalk.com', password:'toto'});
	test.equals('gtalk.com', c.host);
	test.done();
};*/
/*
exports.testClient = function(test) {
	test.expect(3);
	var MESSAGE = "Beuha de test!";
	var b = new Client(conf.b);
	b.addListener('message', function(from, msg, stanza){
		sys.debug('Message from ' + from.red + ' : ' + msg.yellow);
		test.equals(MESSAGE, msg);
		test.done();
	});
	b.addListener('online', function() {
		sys.debug('b is connected'.red);
		test.ok(true);
		var a = new Client(conf.a);
		a.addListener('online', function() {
			sys.debug('a is connected'.green);
			sys.debug('a presences : ' + JSON.stringify(a.presences).green);
//			test.equals('available', a.presences['' + b.jid]);
			test.ok(true);
			a.message(conf.b.jid, MESSAGE);
		});
	});
};
*/

exports.testRoom = function(test) {
	var ROOM = 'mushroom@conference.ip-10-243-73-125';
	var MESSAGE = "Hello everybody";
	var cpt = 0;
	var b = new Client(conf.b, function() {
		sys.debug((conf.b.jid.split('@')[0] + ' is connected').red);
		var b_room = b.room(ROOM, function(status) {
			sys.debug((ROOM + ' room is created').green);

      addUser(
      {
        type: 'add',
        secret: 'evriONE88',
        username: 'test7676',
        password: '1234',
        name: 'TEST 7676',
        email: 'test7676@example.com'
      }, function(err, response)
      {
        console.log(response);
      });

      //setTimeout(function()
      //{
        //b.destoryRoom(ROOM, function()
        //{
          //console.log('ROOM ' + ROOM + ' DESTROYED');
        //});
      //}, 10000);
		});
	});
};

function addUser(properties, callback)
{
  options = {};
  options.host = 'ec2-107-22-57-186.compute-1.amazonaws.com';
  options.path = '/plugins/userService/userservice' + '?' + buildQueryString(properties);
  options.port = 9090;
  options.method = 'GET';

  adminRequest(options, callback);
}

function adminRequest(options, callback)
{
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var responseData = '';

    res.on('data', function (chunk)
    {
      responseData += chunk;
    });

    res.on('end', function ()
    {
      if(callback)
        callback(null, responseData);
    });

    res.on('error', function(err)
    {
      console.log('RESPONSE ERROR: ' + err);
    });
  });

  req.on('error', function(err)
  {
    console.log('REQUEST ERROR: ' + err);
  });
  req.end();
}

function buildQueryString(parameters){
  var qs = "";
  for(var key in parameters) {
    var value = parameters[key];
    qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
  }
  if (qs.length > 0){
    qs = qs.substring(0, qs.length-1); //chop off last "&"
  }
  return qs;
}
/*
exports.testPubSub = function(test) {
	var POEMS = 'poems';
	var b = new Client(conf.b, function() {
		sys.debug('b is connected'.red);
		this.addListener('iq:error', function(id, stanza) {
			sys.error(stanza.toString().red);
			test.done();
		});
		this.pubsub().node(POEMS, function() {
			sys.debug('got my node'.yellow);
			sys.debug('node : ' + this.toString().red);
			this.suscribe(
				function(item) {
					sys.debug('MESSAGE PUBSUB : ' + item.toString().yellow);
					test.done();
				},
				function(subsription, id) {
					this.publish(new xmpp.Element('entry', {xmlns: 'http://www.w3.org/2005/Atom'})
						.c('title').t('blab blah')
						.tree());
				}
			);
		});
	});
};
*/

if(module.id == '.') {
	var testrunner = require('nodeunit').reporters.default;
	testrunner.run(['test.js']);
}
