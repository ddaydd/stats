if(Package['iron:router']) {
  Package['iron:router'].Router.onRun(function() {
    if(Meteor.isClient) {
      var hasSession = Session.get('daydStats');
      var path = window.location.pathname;
      if(this.location.get().path) path = this.location.get().path;
      Meteor.call('statsInsert', path, hasSession, function(err, id) {
        Session.set('daydStats', id);
      });
    }
    this.next();
  });
}
else {
  console.log('package dayd:stats need packages iron:router')
}
