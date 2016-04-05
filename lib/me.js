var asana = require('asana');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var env = require('node-env-file');

var dirHome = process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"];
var envfile = path.join(dirHome, '.bitbar_asana');
env(envfile);

var accesstoken = process.env.BITBAR_ASANA_ACCESSTOKEN;

var client = asana.Client.create().useAccessToken(accesstoken);
client.users.me().then(function(me) {
  console.log('ID of %s (%s) is %s.', me.name, me.email, me.id);
  console.log('Workspace that belongs is as follows.');
  _.each(me.workspaces, function(ws) {
    console.log('  %s (%s)', ws.name, ws.id);
  });
});
