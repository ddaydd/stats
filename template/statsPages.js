Array.prototype.indeOfObjValue = function(value, key) {
  for(var i = 0, len = this.length; i < len; i++) {
    if(this[i][key] === value) return i;
  }
  return -1;
};

Template.daydStatsPages.onCreated(function() {
  Meteor.subscribe("daydStatsPath");
});

function compare(a, b) {
  if(a.count < b.count)
    return -1;
  if(a.count > b.count)
    return 1;
  return 0;
}

Template.daydStatsPages.helpers({

  pages: function() {
    var pagesArr = [], count, i;
    var pages = DaydStatsPath.find({}).fetch();
    _.each(pages, function(pages) {
      i = pagesArr.indeOfObjValue(pages.path, 'path');
      if(i > -1) {
        count = pagesArr[i].count + 1;
        pagesArr[i] = {path: pages.path, count: count};
      }
      else
        pagesArr.push({path: pages.path, count: 1});
    });

    pagesArr.sort(compare);
    return pagesArr.reverse();
  }

});


Template.daydStatsPages.events({

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
