Meteor.publish("daydStats", function() {
  return DaydStats.find();
});

Meteor.publish("daydStatsPath", function() {
  return DaydStatsPath.find();
});

Meteor.publish("daydStatsReferer", function() {
  return DaydStatsReferer.find();
});
Meteor.publish("daydStatsUserById", function(id) {
  if(id)
    return DaydStatsUsers.find({_id: id});
  return DaydStatsUsers.find();
});
