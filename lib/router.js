if(Package['iron:router']) {
  Package['iron:router'].Router.onRun(function() {
    if(Meteor.isClient) {
      var hasSession = Session.get('daydStats');
      var path = window.location.pathname;
      if(this.location.get().path)
        path = this.location.get().path
      Meteor.call('statsInsert', path, hasSession, function(err, id) {
        Session.set('daydStats', id);
      });
    }
    this.next();
  });

  Package['iron:router'].Router.map(function() {

    this.route('daydStats', {
      path: '/daydstats'
    });

    this.route('daydStatsIp', {
      path: '/daydstats/ip/:ip',
      data: function() {
        return {ip: this.params.ip};
      }
    });

    this.route('daydStatsReferers', {
      path: '/daydstats/referers'
    });

    this.route('daydStatsPages', {
      path: '/daydstats/pages'
    });
  });

}
else {
  console.log('package dayd:stats need packages iron:router')
}

