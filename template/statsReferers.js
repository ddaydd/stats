Template.daydStatsReferers.onCreated(function() {
  Meteor.subscribe("daydStatsReferer");
});

Template.daydStatsReferers.helpers({

  referers: function() {
    return DaydStatsReferer.find({}, {sort: {count: -1}});
  }

});


Template.daydStatsReferers.events({

  'click .js-delete': function() {
    Meteor.call('statsRemove', this._id);
  },

  'click .js-as-robot': function() {
    Meteor.call('statsAsRobot', this._id, true);
  },

  'click .js-as-humain': function() {
    Meteor.call('statsAsRobot', this._id, false);
  }

});
