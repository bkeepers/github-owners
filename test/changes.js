const expect = require('expect');

const Changes = require('../lib/changes');

describe('Changes', () => {
  let changes;
  let file;
  let paths;

  describe('owners property', () => {
    beforeEach(() => {
      file = {
        for: expect.createSpy().andReturn(['manny', 'moe', 'jack'])
      };

      paths = ['foo', 'bar', 'baz'];

      changes = new Changes(paths, file);
    });

    it('returns the appropriate values', () => {
      const fileContents = changes.fileContents;

      expect(fileContents).toInclude('manny');
      expect(fileContents).toInclude('moe');
      expect(fileContents).toInclude('jack');
      expect(fileContents.length).toEqual(3);
    });
  });
});
