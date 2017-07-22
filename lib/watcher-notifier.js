const watchersFile = require('owners-file');
const Changes = require('./changes');

module.exports = class WatcherNotifier {
  constructor(github, context) {
    this.github = github;
    this.context = context;
  }

  get repo() {
    return {
      owner: this.context.payload.repository.owner.login,
      repo: this.context.payload.repository.name
    };
  }

  async check() {
    const changes = await this.getChanges();

    return this.comment(await this.getWatchersToPing(changes.fileContents));
  }

  async getChanges() {
    const watchers = await this.getWatchers();
    const paths = [this.context.payload.label.name];

    return new Changes(paths, watchers);
  }

  async getComments() {
    const options = Object.assign({
      number: this.context.payload.number
    }, this.repo);

    return this.github.issues.getComments(options);
  }

  async getWatchers() {
    const options = Object.assign({path: 'WATCHERS'}, this.repo);
    const data = await this.github.repos.getContent(options);

    return watchersFile(Buffer.from(data.data.content, 'base64').toString());
  }

  async getWatchersToPing(watchers) {
    const alreadyPinged = await this.getAlreadyPingedWatchers();

    return watchers.filter(watcher => !alreadyPinged.includes(watcher));
  }

  async getAlreadyPingedWatchers() {
    const comments = await this.getComments();
    const allPings = comments.data.filter(comment => comment.user && comment.user.type && comment.user.type === 'Bot')
                             .filter(comment => comment.body && comment.body.match(/^\/cc/))
                             .reduce((pings, comment) => {
                               return pings.concat(comment.body.split(' ').slice(1));
                             }, []);

    return Array.from(new Set(allPings));
  }

  async comment(watchersToPing) {
    if (watchersToPing.length > 0) {
      return this.github.issues.createComment(Object.assign({
        number: this.context.payload.number,
        body: '/cc ' + watchersToPing.join(' ')
      }, this.repo));
    }
  }
};
