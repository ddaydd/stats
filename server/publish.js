Meteor.publish("daydStats", function() {
  return DaydStats.find();
});

Meteor.publish("daydStatsPath", function() {
  return DaydStatsPath.find();
});

Meteor.publish("daydStatsReferer", function() {
  return DaydStatsReferer.find();
});
