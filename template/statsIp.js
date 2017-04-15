Template.daydStatsIp.onCreated(function() {
  Meteor.subscribe("daydStats");
});

Template.daydStatsIp.helpers({

  ip: function() {
    return this.ip;
  },

  stats: function() {
    return DaydStats.findOne({ip: this.ip});
  },

  paths: function() {
    return DaydStatsPath.find({source_id: this._id}, {sort: {createdAt: -1}});
  },

  show: function(what) {
    return Session.get('dayd-show') === what;
  },

  cacheControl: function() {
    return this['cache-control'];
  },

  userAgent: function() {
    return this['user-agent'];
  },

  acceptLanguage: function() {
    return this['accept-language'];
  },

  username: function() {
    if(this.userId)
      return Meteor.users.findOne(this.userId).username;
  }
});


Template.daydStatsIp.events({

  'click .js-delete': function() {
    $('.js-delete').text('wait...');
    Meteor.call('statsRemove', this._id, function(err, res) {
      if(!err)
        Router.go('daydStats');
      else console.error(err)
    });
  },

  'click .js-as-robot': function() {
    Meteor.call('statsAsRobot', this._id, true);
  },

  'click .js-as-humain': function() {
    Meteor.call('statsAsRobot', this._id, false);
  }

});
