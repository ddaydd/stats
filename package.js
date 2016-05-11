Package.describe({
  name: 'dayd:stats',
  version: '0.0.85',
  // Brief, one-line summary of the package.
  summary: "Visitor stat package to log visits on your site automatically",
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/ddaydd/stats.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.3');

  api.use([
    'mongo',
    'meteorhacks:aggregate@1.3.0',
    'gadicohen:headers@0.0.30',
    'twbs:bootstrap'
  ]);

  api.use("templating", "client");
  api.add_files('lib/collection.js', ['server', 'client']);
  api.add_files('lib/router.js', ['server', 'client']);
  api.add_files('server/publish.js', ['server']);
  api.add_files('server/methods.js', ['server']);
  api.add_files("template/stats.html", "client");
  api.add_files('template/stats.js', ['client']);
  api.add_files("template/statsIp.html", "client");
  api.add_files('template/statsIp.js', ['client']);
  api.add_files("template/statsReferers.html", "client");
  api.add_files('template/statsReferers.js', ['client']);
  api.add_files("template/statsPages.html", "client");
  api.add_files('template/statsPages.js', ['client']);
  api.add_files('template/stats.css', ['client']);

  api.export(['DaydStatsPath'], ['client', 'server']);
});
