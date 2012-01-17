var sys = require('sys'),
	xmpp = require('node-xmpp'),
	colors = require('colors'),
	Room = require('./room').Room,
	BasicClient = require('./basic-client').BasicClient;

var Client = function(params, callback) {
	var jabber = this;
	this.roster = {};
	this.rooms = {};
	this.color = (params.color != null) ? params.color : 'blue';
	this.presences = {};
	BasicClient.call(this, params, function() {
		this.presence();
		callback.apply(this);
	});
	this.registerIqHandler('http://jabber.org/protocol/disco#info', function(stanza) {
		sys.debug((stanza.attrs.from + " wont to disco!")[jabber.color]);
		jabber.resultIq(stanza, new xmpp.Element('query', {xmlns: 'http://jabber.org/protocol/disco#info'})
		.c('feature', {'var': 'http://jabber.org/protocol/disco#info'}).up()
		.c('feature', {'var': 'http://jabber.org/protocol/disco#items'}).up()
		.c('feature', {'var': 'http://jabber.org/protocol/muc'}).up()
		.c('identity', {
			category: 'conference',
			type: 'text',
			name: 'Play-Specific Chatrooms'
		}).up()
		.tree()
		);
	});
	this.registerIqHandler('jabber:iq:last', function(stanza) {
		sys.debug((stanza.attrs.from + ' wonts last')[jabber.color]);
		//[FIXME] giving a good last time
		jabber.resultIq(stanza, new xmpp.Element('query', {
			xmlns: 'jabber:iq:last', seconds:'1'})
			.tree()
		);
	});
	this.registerIqHandler('jabber:iq:version', function(stanza) {
		jabber.resultIq(stanza, new xmpp.Element('query', {xmlns:'jabber:iq:version'})
			.c('name').t('node-xmpp-client').up()
			.c('version').t('0.0.2').up()
			.c('os').t(process.platform).up()
			.tree()
		);
	});
	
	this.addListener('presense', function(stanza) {
	  var jfrom = new xmpp.JID(stanza.attrs.from);
		var roomName = jfrom.user + '@' + jfrom.domain;
		if(stanza.attrs.type == 'error') {
			sys.error(stanza.toString().inverse);
			if(jabber.rooms[roomName] != null) {
				jabber.rooms[roomName].emit('presence:error', stanza.getChild('error'), stanza);
			} else {
				jabber.emit('presence:error', stanza.getChild('error'), stanza);
			}
		} else {
			if(jabber.rooms[roomName] != null) {
				jabber.rooms[roomName].emit('presence', stanza.attrs.from, stanza);
			} else {
				jabber.emit('presence', stanza.attrs.from, stanza);
			}
		}
  };
  
  this.addListener('message', function(stanza) {
    var from = stanza.attrs.from;
		if(stanza.attrs.type == 'groupchat') {
		  var fromName = from.split('/')[0];
			jabber.rooms[fromName].emit('message', from, stanza.getChild('body').getText(), stanza);
		}
  };
};

sys.inherits(Client, BasicClient);
exports.Client = Client;

Client.prototype.getRoster = function(callback) {
	var jabber = this;
	this.iq(null, new xmpp.Element('query', {xmlns: 'jabber:iq:roster'}), function(iq) {
		iq.getChild('query', 'jabber:iq:roster').getChildren('item').forEach(function(child) {
			jabber.roster[child.attrs.jid] = {
				name: child.attrs.jid,
				subscription: child.attrs.subscription};
		});
		jabber.emit('roster', jabber.roster);
		callback.call(jabber, jabber.roster);
	});
};

/*
http://xmpp.org/extensions/xep-0092.html
*/
Client.prototype.getVersion = function(jid, success, error) {
	var jabber = this;
	this.iq(jid, new xmpp.Element('query', {xmlns: 'jabber:iq:version'}), function(iq) {
		var v = iq.getChild('query', 'jabber:iq:version');
		var version = {
			name: v.getChildText('name'),
			version: v.getChildText('version'),
			os: v.getChildText('os')
		};
		success.call(jabber, version);
	}, error);
};

/*
http://xmpp.org/extensions/xep-0012.html
*/

Client.prototype.getLast = function(jid, success, error) {
	var jabber = this;
	this.iq(jid, new xmpp.Element('query', {xmlns: 'jabber:iq:last'}),
	function(iq) {
		success.call(jabber, parseInt(iq.getChild('query', 'jabber:iq:last').attrs.seconds, 10));
	},
	error
	);
};

Client.prototype.disconnect = function() {
	this.xmpp.send(new xmpp.Element('presence', {type: 'unavailable'})
		.c('status').t('Logged out')
		.tree());
	var jabber = this;
	this.xmpp.end();
	sys.debug("disconnect from XMPP");
};

Client.prototype.iqSet = function(to, query, callback) {
	var n = 'node' + this._iq++;
	if(callback != null) {
		this._iqCallback[n] = callback;
	}
	var attrs = {
		type: "set",
		id: n
	};
	if(to != null) {
		attrs.to = to;
	}
	this.xmpp.send(new xmpp.Element('iq', attrs).cnode(query).tree());
	return n;
};

Client.prototype.canonicalRoomName = function(room) {
	if(room.indexOf('@') > 0) {
		return room;
	} else {
		return room + '@conference.' + this.client.jid.domain;
	}
};

Client.prototype.room = function(name, callback) {
	var room = this.canonicalRoomName(name);
	if(this.rooms[room] == null) {
		this.rooms[room] = new Room(this, room, callback);
	}
	return this.rooms[room];
};

Client.prototype.pubsub = function(to) {
	return new Pubsub(this, to);
};
