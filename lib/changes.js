module.exports = class Changes {
  constructor(paths, file) {
    this.paths = paths;
    this.file = file;
  }

  get fileContents() {
    return Array.from(new Set(this.paths.reduce((result, path) => {
      return result.concat(this.file.for(path));
    }, [])));
  }
};
