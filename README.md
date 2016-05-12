# dayd:stats ( WIP )

Github:
https://github.com/ddaydd/stats

AtmosphereJS:
https://atmospherejs.com/dayd/stats

Report bugs or suggestions:
https://github.com/ddaydd/stats/issues

## Installation

```sh
$ meteor add dayd:stats
```

##

see your stats at /daydstats

## dependency

iron-router

## Add routes to your application

Router.route('/daydstats', {
  name: 'daydStats',
  path: '/daydstats',
  layoutTemplate: '_adminLayout'
});

Router.route('/daydstats/ip/:ip', {
  name: 'daydStatsIp',
  path: '/daydstats/ip/:ip',
  layoutTemplate: '_adminLayout',
  data: function() {
    return {ip: this.params.ip};
  }
});

Router.route('/daydstats/referers', {
  name: 'daydStatsReferers',
  path: '/daydstats/referers',
  layoutTemplate: '_adminLayout'
});

Router.route('/daydstats/pages', {
  name: 'daydStatsPages',
  path: '/daydstats/pages',
  layoutTemplate: '_adminLayout'
});
