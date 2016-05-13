/**
 * Created by judyrandry on 5/12/16.
 */
Accounts.onLogin(function() {
  Meteor.call("statsUserInsert", Meteor.user().username, Meteor.user().emails[0].address, function(err, res) {
    if(err)console.log(err);
    return res;
  });
});
