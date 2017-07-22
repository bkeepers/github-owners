const expect = require('expect');

const Changes = require('../lib/changes');
const WatcherNotifier = require('../lib/watcher-notifier');

function createComment(userType, body) {
  return {
    body,
    user: {
      type: userType
    }
  };
}

describe('WatcherNotifier', () => {
  const BASE_SHA = '1234567890abcdef1234567890abcdef12345678';
  const HEAD_SHA = '234567890abcdef1234567890abcdef123456789';
  const ISSUE_NUMBER = 42;

  let event;
  let github;
  let notifier;

  beforeEach(() => {
    event = {
      payload: {
        repository: {
          name: 'bar',
          owner: {
            login: 'foo'
          }
        },
        label: {
          name: 'wibble'
        }
      }
    };
  });

  describe('repo property', () => {
    beforeEach(() => {
      github = expect.createSpy();
      notifier = new WatcherNotifier(github, event);
    });

    it('extracts the right information', () => {
      expect(notifier.repo).toMatch({owner: 'foo', repo: 'bar'});
      expect(github).toNotHaveBeenCalled();
    });
  });

  describe('getWatchers', () => {
    beforeEach(() => {
      github = {
        repos: {
          getContent: expect.createSpy().andReturn(Promise.resolve({
            data: {
              content: Buffer.from('@manny\n@moe\n@jack').toString('base64')
            }
          }))
        }
      };

      notifier = new WatcherNotifier(github, event);
    });

    it('returns an watchersFile object', async () => {
      const watchersFile = await notifier.getWatchers();

      expect(watchersFile).toExist();
      expect(watchersFile.for).toExist();
      expect(github.repos.getContent).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        path: 'WATCHERS'
      });
    });
  });

  describe('getChanges', () => {
    beforeEach(() => {
      event.payload.pull_request = {
        base: {
          sha: BASE_SHA
        },
        head: {
          sha: HEAD_SHA
        }
      };

      github = {
        repos: {
          compareCommits: expect.createSpy().andReturn(Promise.resolve({
            data: {
              files: [
                {
                  filename: 'wibble'
                },
                {
                  filename: 'wobble'
                }
              ]
            }
          })),
          getContent: expect.createSpy().andReturn(Promise.resolve({
            data: {
              content: Buffer.from('manny\nmoe\njack').toString('base64')
            }
          }))
        }
      };

      notifier = new WatcherNotifier(github, event);
    });

    it('returns an appropriate Changes object', async () => {
      const changes = await notifier.getChanges();

      expect(changes).toBeA(Changes);
      expect(changes.paths).toInclude('wibble');
      expect(changes.paths.length).toEqual(1);
    });
  });

  describe('comment', () => {
    beforeEach(() => {
      event.payload.number = ISSUE_NUMBER;

      github = {
        issues: {
          createComment: expect.createSpy().andReturn(Promise.resolve())
        }
      };

      notifier = new WatcherNotifier(github, event);
    });

    it('returns successfully', async () => {
      await notifier.comment([
        '@manny',
        '@moe',
        '@jack'
      ]);

      expect(github.issues.createComment).toHaveBeenCalledWith({
        owner: 'foo',
        repo: 'bar',
        number: ISSUE_NUMBER,
        body: '/cc @manny @moe @jack'
      });
    });
  });

  describe('getAlreadyPingedWatchers', () => {
    beforeEach(() => {
      event.payload.number = ISSUE_NUMBER;

      github = {
        issues: {},
        users: {
          get: expect.createSpy().andReturn(Promise.resolve({
            data: {
              type: 'Bot'
            }
          }))
        }
      };

      notifier = new WatcherNotifier(github, event);
    });

    it('recognizes a properly formed comment from a Bot user', async () => {
      github.issues.getComments = expect.createSpy().andReturn(Promise.resolve(
        {data: [createComment('Bot', '/cc @manny')]}
    ));

      const pings = await notifier.getAlreadyPingedWatchers();

      expect(pings.length).toEqual(1);
      expect(pings).toInclude('@manny');
    });

    it('recognizes multiple pings in a single comment from a Bot user', async () => {
      github.issues.getComments = expect.createSpy().andReturn(Promise.resolve(
        {data: [createComment('Bot', '/cc @manny @moe @jack')]}
    ));

      const pings = await notifier.getAlreadyPingedWatchers();

      expect(pings.length).toEqual(3);
      expect(pings).toInclude('@manny');
      expect(pings).toInclude('@moe');
      expect(pings).toInclude('@jack');
    });

    it('rejects pings from other user types', async () => {
      github.issues.getComments = expect.createSpy().andReturn(Promise.resolve(
        {data: [createComment('User', '/cc @manny @moe @jack')]}
    ));

      const pings = await notifier.getAlreadyPingedWatchers();

      expect(pings.length).toEqual(0);
    });

    it('rejects pings that are not formatted correctly', async () => {
      github.issues.getComments = expect.createSpy().andReturn(Promise.resolve(
        {data: [createComment('User', '@manny @moe @jack')]}
    ));

      const pings = await notifier.getAlreadyPingedWatchers();

      expect(pings.length).toEqual(0);
    });

    it('only includes one copy of any name', async () => {
      github.issues.getComments = expect.createSpy().andReturn(Promise.resolve(
        {data: [createComment('Bot', '/cc @manny @manny'), createComment('Bot', '/cc @manny')]}
    ));

      const pings = await notifier.getAlreadyPingedWatchers();

      expect(pings.length).toEqual(1);
    });
  });

  describe('getWatchersToPing', () => {
    beforeEach(() => {
      event.payload.number = ISSUE_NUMBER;

      github = {
        issues: {}
      };

      notifier = new WatcherNotifier(github, event);
    });

    it('returns only watchers that have not been pinged', async () => {
      github.issues.getComments = expect.createSpy().andReturn(Promise.resolve(
        {data: [createComment('Bot', '/cc @manny')]}
    ));

      const pings = await notifier.getWatchersToPing(['@manny', '@moe', '@jack']);

      expect(pings.length).toEqual(2);
      expect(pings).toInclude('@moe');
      expect(pings).toInclude('@jack');
    });
  });
});
