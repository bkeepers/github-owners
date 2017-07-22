const OwnerNotifier = require('./lib/owner-notifier');
const WatcherNotifier = require('./lib/watcher-notifier');

module.exports = robot => {
  const notifyOwners = async function (context) {
    const github = await robot.auth(context.payload.installation.id);
    const notifier = new OwnerNotifier(github, context);

    return notifier.check();
  };

  const notifyWatchers = async function (context) {
    const github = await robot.auth(context.payload.installation.id);
    const notifier = new WatcherNotifier(github, context);

    return notifier.check();
  };

  robot.on('pull_request.opened', notifyOwners);
  robot.on('pull_request.synchronize', notifyOwners);
  robot.on('pull_request.labeled', notifyWatchers);
};
