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
Template.daydStatsPath.helpers({
  statsByPath: function() {
    Meteor.call("statsNotFilteredGroupedPathCount", this.customPath, this.userSelected, this.all, this.hide, function(err, result) {
      if(err)
        return console.log(err);
      Session.set('stats_list_by_path', result);
    });
    return Session.get('stats_list_by_path');
  },
  statsNumberOfUsersDistinct: function() {
    Meteor.call("statsUsersDistinct", this.distinct, this.hide, function(err, result) {
      if(err)
        return console.log(err);
      Session.set('stats_number_of_users_distinct', result);
    });
    return Session.get('stats_number_of_users_distinct');
  },
  usersNumbersCount: function() {
    Meteor.call('statsUsersCount', this.hide, function(err, result) {
      if(err)
        return console.log(err);
      Session.set('stats_users_count', result);
    });
    return Session.get('stats_users_count');
  }
  ,
  usersWithConnectionDuration: function() {
    Meteor.call('getStatsDurationConnectionAverage', this.userSelected, this.all, this.hide, function(err, result) {
      if(err)
        console.log(err);
      Session.set('stats_user_with_duration', result);
    });
    return Session.get('stats_user_with_duration');
  },
  connectionDuration: function() {
    return formatDuration(this.avgConnectionDuration);
  },
  pathPerConnection: function() {
    Meteor.call('getPathsPerUserConnection', this.userSelected, this.all, this.hide, function(err, result) {
      if(err)
        console.log(err);
      Session.set('stats_pages_per_connection', result);
    });
    return Session.get('stats_pages_per_connection');
  },
  durationEnterPaths: function() {
    Meteor.call('getDurationConnectionPaths', this.customPaths, this.userSelected, this.all, this.hide, function(err, result) {
      if(err)console.log(err);
      Session.set('stats_duration_enter_paths', result);
    });
    return Session.get('stats_duration_enter_paths');
  },
  durationPaths: function() {
    return formatDuration(this.avgConnectionPaths);
  },
  customStatsList: function() {
    var c = this.customName;
    Meteor.call('getCustomStatsWithParameter', c, this.userSelected, this.all, this.hide, function(err, resust) {
      if(err)console.log(err);
      Session.set('stats_custom_listing_' + c, resust);
    });
    return Session.get('stats_custom_listing_' + c);
  },
  customCountNumbers: function() {
    var c = this.customName;
    Meteor.call('getCustomStatsCountWithParameter', c, this.userSelected, this.all, this.hide, function(err, result) {
      if(err) console.log(err);
      Session.set('stats_count_per_custom_name_' + c, result);
    });
    return Session.get('stats_count_per_custom_name_' + c);
  },
  usersConnectedInRealTime: function() {
    Meteor.call('getStatsUsersConnectedInRealTime', this.hide, function(err, res) {
      if(err)console.log(err);
      Session.set('stats_users_connected_in_real_time', res);
    });
    return Session.get('stats_users_connected_in_real_time');
  },
  numberOfUsersConnected: function() {
    var u = Session.get('stats_users_connected_in_real_time');
    if(u)
      return u.length;
  },
  lastDateConnection: function() {
    Meteor.call('getStatsUsersLastConnection', this.userSelected, function(err, res) {
      if(err) console.log(err);
      return Session.set('stats_user_last_connection', res);
    });
    return Session.get('stats_user_last_connection');
  },
  numberVisitsPerUser: function() {
    Meteor.call('getNumberStatsVisitsPerUser', this.userSelected, function(err, res) {
      if(err) console.log(err);
      return Session.set('stats_visits_number_per_user', res);
    });
    return Session.get('stats_visits_number_per_user');
  },
  avgRound: function(nbr) {
    return Math.round(nbr);
  },
  formatDate: function(date) {
    return moment(date).format('DD/MM/YYYY  hh:mm A');
  }
});

function formatDuration(ms) {
  var duration = moment.duration(ms);
  if(duration.asHours() > 1) {
    return Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
  } else {
    return moment.utc(duration.asMilliseconds()).format("mm:ss");
  }
}
