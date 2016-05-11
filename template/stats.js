Template.daydStats.onCreated(function() {
  Meteor.subscribe("daydStats");
  Meteor.subscribe("daydStatsPath");

  Session.set('dayd-show', null);
  Session.set('dayd-show-robots', true);
});

Template.daydStats.helpers({

  stats: function() {
    return DaydStats.find({isRobot: {$ne: Session.get('dayd-show-robots')}}, {sort: {modifiedAt: -1}});
  },

  paths: function() {
    return DaydStatsPath.find({source_id: this._id}, {sort: {createdAt: -1}});
  },

  modifiedAtcreatedAt: function() {
    return this.modifiedAt + '' !== this.createdAt + ''
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
    if(this.userId) {
      var u = Meteor.users.findOne(this.userId);
      if(u && u.username)
        return u.username;
    }
  },
  statsByPath:function(){
    Meteor.call("statsNotFilteredGroupedPathCount", this.customPath, function(err, result) {
      if(err)
        return console.log(err);
      Session.set('stats_list_by_path', result);
    });
    return Session.get('stats_list_by_path');
  }
});


Template.daydStats.events({

  'click .js-path': function() {
    if(Session.get('dayd-show') === 'path')
      Session.set('dayd-show', null);
    else
      Session.set('dayd-show', 'path');
  },

  'click .js-headers': function() {
    if(Session.get('dayd-show') === 'headers')
      Session.set('dayd-show', null);
    else
      Session.set('dayd-show', 'headers');
  },

  'click .js-location': function() {
    if(Session.get('dayd-show') === 'location')
      Session.set('dayd-show', null);
    else
      Session.set('dayd-show', 'location');
  },

  'click .js-with-robots': function() {
    if(Session.get('dayd-show-robots'))
      Session.set('dayd-show-robots', false);
    else
      Session.set('dayd-show-robots', true);
  },

  'click .js-delete': function() {
    Meteor.call('statsRemove', this._id);
  }

});
