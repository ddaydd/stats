/**
 * Created by judyrandry on 5/12/16.
 */
Accounts.onLogin(function() {

  var u = Meteor.user();
  var username, email;

  if(u.username)
    username = u.username;
  else if(u.profile && u.profile.name)
    username = u.profile.name;
  else
    username = 'unknown';

  if(u.emails && u.emails.length && u.emails[0].address)
    email = u.emails[0].address;
  else if(u.services && u.services.google && u.services.google.email)
    email = u.services.google.email;
  else
    username = 'unknown';

  Meteor.call("statsUserInsert", username, email, function(err, res) {
    if(err)console.log(err);
    return res;
  });
});
Template.registerHelper('getUserById', function(userId) {
  var u = Meteor.users.findOne({_id: userId});
  if(u && u.emails && u.emails[0].address)
    return u.emails[0].address;
  return TAPi18n.__("daydStatsUserNotFound");
});
