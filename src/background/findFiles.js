import glob from "glob";

export default (path) => new Promise((resolve) => glob(path, (error, files) => resolve(files)));