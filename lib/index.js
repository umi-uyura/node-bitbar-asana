var asana = require('asana');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var path = require('path');
var env = require('node-env-file');

var ASANA_URL_BASE = 'https://app.asana.com/0/';
var ASANA_MENUBAR_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAABAklEQVR4AW1RJ2ICURQcyp+3rMWBxqT3xKReAJNyCyxIJAfAozkBkiugyA1SHCY94eU3Ov/1ebNldjE9GZ+z1mYTltZs8tFacx0lB0hblNZEpR2Q2ckChTLfqfyxpvwolB26QOAm/6yNrbm6tUjIuOBQlJ/8tHkYkNk6DwLmTF5Frb2YMwC0aGb5bYt84AOKy+ogNemxm9xM0OSGXelJLY7sTOSx6ufqdO4AMIdR3AeVA08YOKFBsDkE7+z4TeWYKs9IkcqzmyJ6B6lQrX3xQ1T6/o364u7w5XCpAGBd1BlHZtcRzC5HEalHIckFW2ykpcnfTEtssJVchO38J83N5bj5BynJX+qZZpYZAAAAAElFTkSuQmCC';
var ENVFILE_DEFAULT = '.bitbar_asana';

var envfile = ENVFILE_DEFAULT;
if (process.argv.length < 3) {
  var dirHome = process.env.HOME;
  envfile = path.join(dirHome, envfile);
} else {
  envfile = process.argv[2];
}

env(envfile);

var accesstoken = process.env.BITBAR_ASANA_ACCESSTOKEN;
var workspaceId = process.env.BITBAR_ASANA_WORKSPACEID;
var assigneeId = process.env.BITBAR_ASANA_ASSIGNEE_ID;
var lang = process.env.BITBAR_ASANA_LANGUAGE || 'en';
var menubarIcon = process.env.BITBAR_ASANA_MENUBARICON || ASANA_MENUBAR_IMAGE;

var client = asana.Client.create().useAccessToken(accesstoken);

moment.locale(lang);

console.log('| templateImage=' + menubarIcon);
console.log('---');

async.waterfall([
  function(done) {
    client.workspaces.findById(workspaceId).then(function(ws) {
      console.log('Workspace: %s | href=%s%s', ws.name, ASANA_URL_BASE, workspaceId);
      console.log('--Calendar | href=%s%s/calendar', ASANA_URL_BASE, workspaceId);
      console.log('-----');
      done(null);
    });
  },
  function(done) {
    client.projects.findAll({workspace: workspaceId}).then(function(projects) {
      _.each(projects.data, function(pj) {
        console.log('--%s | href=%s%s', pj.name, ASANA_URL_BASE, pj.id);
      });
      console.log('---');

      done(null, projects.data);
    });
  },
  function(projects, done) {
    var params = {
      workspace: workspaceId,
      assignee: assigneeId,
      opt_fields: 'completed,due_on,name,projects'
    };

    client.tasks.findAll(params).then(function(collection) {
      var today = moment();

      var tasks = _.filter(collection.data, function(task) {
        return !task.completed && task.due_on;
      });

      tasks = _.sortBy(tasks, function(task) {
        return task.due_on ? (moment(task.due_on)).unix() : 8640000000000000/*Date MAX*/;
      });

      var nextweek = null;
      _.each(tasks, function(task, index) {
        var due = moment(task.due_on);
        var expiration = (today > due);
        var nearly = moment().add((7 - today.weekday()), 'd');
        var project = task.projects.length ? _.findWhere(projects, {id: task.projects[0].id}) : null;

        if (!nextweek && (due > nearly)) {
          console.log('---');
          nextweek = due;
        }

        console.log('%s %s  [%s] | href=%s%s/%s color=%s',
                    due.format('YYYY-MM-DD(ddd)'),
                    task.name,
                    project ? project.name : '',
                    ASANA_URL_BASE,
                    workspaceId,
                    task.id,
                    expiration ? 'red' : 'black');
      });
    });
    done();
  }
], function(err, result) {
  if(err) {
    console.log('Error: ' + err);
  }
});
