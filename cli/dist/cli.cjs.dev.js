'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var meow = _interopDefault(require('meow'));
var path = require('path');
var path__default = _interopDefault(path);
var enquirer = _interopDefault(require('enquirer'));
var pLimit = _interopDefault(require('p-limit'));
var DataLoader = _interopDefault(require('dataloader'));
var chalk = _interopDefault(require('chalk'));
var fastGlob = _interopDefault(require('fast-glob'));
var fs = require('fs-extra');
var detectIndent = _interopDefault(require('detect-indent'));
var parseJson = _interopDefault(require('parse-json'));
var util = _interopDefault(require('util'));
var normalizePath = _interopDefault(require('normalize-path'));
var parseGlob = _interopDefault(require('parse-glob'));
var packlist = _interopDefault(require('npm-packlist'));
var equal = _interopDefault(require('fast-deep-equal'));
var resolveFrom = _interopDefault(require('resolve-from'));
var rollup = require('rollup');
var resolve = _interopDefault(require('@rollup/plugin-node-resolve'));
var alias = _interopDefault(require('@rollup/plugin-alias'));
var cjs = _interopDefault(require('@rollup/plugin-commonjs'));
var replace = _interopDefault(require('@rollup/plugin-replace'));
var builtInModules = _interopDefault(require('builtin-modules'));
var os = require('os');
var babel = require('@babel/core');
var json = _interopDefault(require('@rollup/plugin-json'));
var Worker = _interopDefault(require('jest-worker'));
var isCI = _interopDefault(require('is-ci'));
var QuickLRU = _interopDefault(require('quick-lru'));
var semver = _interopDefault(require('semver'));
var codeFrame = require('@babel/code-frame');
var estreeWalker = require('estree-walker');
var isReference = _interopDefault(require('is-reference'));
var MagicString = _interopDefault(require('magic-string'));
var ms = _interopDefault(require('ms'));

let limit = pLimit(1); // there might be a simpler solution to this than using dataloader but it works so ¯\_(ツ)_/¯

let prefix = `🎁 ${chalk.green("?")}`;
function createPromptConfirmLoader(message) {
  let loader = new DataLoader(pkgs => limit(() => (async () => {
    if (pkgs.length === 1) {
      // @ts-ignore
      let {
        confirm
      } = await enquirer.prompt([{
        // @ts-ignore
        type: "confirm",
        name: "confirm",
        message,
        // @ts-ignore
        prefix: prefix + " " + pkgs[0].name,
        initial: true
      }]);
      return [confirm];
    } // @ts-ignore


    let {
      answers
    } = await enquirer.prompt([{
      type: "multiselect",
      name: "answers",
      message,
      choices: pkgs.map(pkg => ({
        name: pkg.name,
        initial: true
      })),
      // @ts-ignore
      prefix
    }]);
    return pkgs.map(pkg => {
      return answers.includes(pkg.name);
    });
  })()));
  return pkg => loader.load(pkg);
}
let doPromptInput = async (message, pkg, defaultAnswer) => {
  // @ts-ignore
  let {
    input
  } = await enquirer.prompt([{
    // @ts-ignore
    type: "input",
    name: "input",
    message,
    // @ts-ignore
    prefix: prefix + " " + pkg.name,
    initial: defaultAnswer
  }]);
  return input;
};
let promptInput = (message, pkg, defaultAnswer) => limit(() => doPromptInput(message, pkg, defaultAnswer));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
class Item {
  constructor(filePath, contents, jsonDataByPath) {
    _defineProperty(this, "path", void 0);

    _defineProperty(this, "indent", void 0);

    _defineProperty(this, "directory", void 0);

    _defineProperty(this, "_jsonDataByPath", void 0);

    this.indent = detectIndent(contents).indent || "  ";
    this.path = filePath;
    this.directory = path__default.dirname(filePath);
    this._jsonDataByPath = jsonDataByPath;

    if (!jsonDataByPath.has(this.path)) {
      const json = parseJson(contents, filePath);
      jsonDataByPath.set(this.path, {
        value: json,
        stringifiedSaved: JSON.stringify(json)
      });

      if (!this.json.preconstruct) {
        this.json.preconstruct = {};
      }
    }
  }

  get json() {
    return this._jsonDataByPath.get(this.path).value;
  }

  set json(value) {
    this._jsonDataByPath.set(this.path, {
      value,
      stringifiedSaved: this._jsonDataByPath.get(this.path).stringifiedSaved
    });
  }

  async save() {
    const json = _objectSpread({}, this.json);

    if (json.preconstruct && json.preconstruct !== null && typeof json.preconstruct === "object" && !Object.keys(json.preconstruct).length) {
      delete json.preconstruct;
    }

    let stringified = JSON.stringify(json);

    if (stringified !== this._jsonDataByPath.get(this.path).stringifiedSaved) {
      await fs.writeFile(this.path, JSON.stringify(json, null, this.indent) + "\n");
      return true;
    }

    return false;
  }

}

function format(message, messageType, scope) {
  let prefix = {
    error: " " + chalk.red("error"),
    success: " " + chalk.green("success"),
    info: " " + chalk.cyan("info"),
    none: ""
  }[messageType];
  let fullPrefix = "🎁" + prefix + (scope ? " " + chalk.cyan(scope) : "");
  return String(message).split("\n").map(line => {
    if (!line.trim()) {
      return fullPrefix;
    }

    return `${fullPrefix} ${line}`;
  }).join("\n");
}
function error(message, scope) {
  console.error(format(message, "error", scope));
}
function success(message, scope) {
  console.log(format(message, "success", scope));
}
function info(message, scope) {
  console.log(format(message, "info", scope));
}
function log(message) {
  console.log(format(message, "none"));
}

function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
class FatalError extends Error {
  constructor(message, scope) {
    super(message);

    _defineProperty$1(this, "scope", void 0);

    this.scope = scope;
  }

}
class BatchError extends Error {
  constructor(errors) {
    super(errors.map(x => {
      return format(x.message, "none", x.scope);
    }).join("\n"));

    _defineProperty$1(this, "errors", void 0);

    this.errors = errors;
  }

}
class ScopelessError extends Error {}
class UnexpectedBuildError extends FatalError {
  constructor(error, pkgName) {
    super(`${util.format("", error).trim()}`, pkgName);
  }

}
class FixableError extends FatalError {}

function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
class Entrypoint extends Item {
  constructor(filePath, contents, pkg, source) {
    super(filePath, contents, pkg._jsonDataByPath);

    _defineProperty$2(this, "package", void 0);

    _defineProperty$2(this, "source", void 0);

    this.package = pkg;
    this.source = source;
  }

  get name() {
    return normalizePath(path__default.join(this.package.name, path__default.relative(this.package.directory, this.directory)));
  }

}

const EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const PKG_JSON_CONFIG_FIELD = "preconstruct";

let errors = {
  noSource: source => `no source file was provided, please create a file at ${source} or specify a custom source file with the ${PKG_JSON_CONFIG_FIELD} source option`,
  deniedWriteMainField: "changing the main field is required to build",
  invalidField: (field, found, expected) => `${field} field ${found === undefined ? chalk.red("was not found") : `is invalid, found \`${chalk.red(JSON.stringify(found))}\``}, expected \`${chalk.green(JSON.stringify(expected))}\``,
  umdNameNotSpecified: `the umd:main field is specified but a umdName option is not specified. please add it to the ${PKG_JSON_CONFIG_FIELD} field in your package.json`,
  noEntrypointPkgJson: "There is a missing package.json for an entrypoint",
  noEntrypoints: "packages must have at least one entrypoint, this package has no entrypoints",
  fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit: field => `all entrypoints in a package must have the same fields and one entrypoint in this package has a ${field} field but you've declined the fix`
};
let confirms = {
  writeMainField: createPromptConfirmLoader("preconstruct is going to change the main field in your package.json, are you okay with that?"),
  writeModuleField: createPromptConfirmLoader("would you like to generate module builds? this will write to the module field in your package.json"),
  fixModuleField: createPromptConfirmLoader("would you like to fix the module field?"),
  fixUmdBuild: createPromptConfirmLoader("would you like to fix the umd field?"),
  fixBrowserField: createPromptConfirmLoader("would you like to fix the browser build?"),
  createEntrypointPkgJson: createPromptConfirmLoader("A package.json file does not exist for this entrypoint, would you like to create one automatically?"),
  createEntrypoint: createPromptConfirmLoader("This glob does not match anything, would you like to create an entrypoint for it?")
};
let inputs = {
  getUmdName: "what should the name used for UMD bundles be?",
  getSource: "what should the source file for this entrypoint be?"
};
let infos = {
  validField: field => `${field} field is valid`,
  validEntrypoint: "a valid entry point exists.",
  validPackageEntrypoints: "package entrypoints are valid"
};
let successes = {
  validProject: "project is valid!",
  startedWatching: "started watching!"
};

async function getUselessGlobsThatArentReallyGlobsForNewEntrypoints(globs, files, cwd) {
  let filesSet = new Set(files.map(x => normalizePath(x)));
  return (await Promise.all(globs.map(async glob => {
    let parsedGlobResult = parseGlob(glob);

    if (!parsedGlobResult.is.glob) {
      let filename = normalizePath(path__default.resolve(cwd, "src", glob));
      if (filesSet.has(filename)) return;

      try {
        await fs.stat(filename);
      } catch (err) {
        if (err.code === "ENOENT") {
          return {
            filename,
            glob,
            exists: false
          };
        }

        throw err;
      }

      return {
        filename,
        glob,
        exists: true
      };
    }
  }))).filter(x => !!x);
}

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function getNameForDistForEntrypoint(entrypoint) {
  return getDistName(entrypoint.package, entrypoint.name);
}
let fields = ["version", "description", "main", "module", "umd:main", "browser"];
function setFieldInOrder(obj, field, value) {
  if (field in obj) {
    let newObj = _objectSpread$1({}, obj);

    newObj[field] = value;
    return newObj;
  }

  let fieldIndex = fields.indexOf(field);
  let idealField = fields.slice(0, fieldIndex).reverse().find(key => {
    return key in obj;
  });

  if (idealField === undefined) {
    return _objectSpread$1({}, obj, {
      [field]: value
    });
  }

  let newObj = {};

  for (let key in obj) {
    newObj[key] = obj[key];

    if (key === idealField) {
      newObj[field] = value;
    }
  }

  return newObj;
}
function getEntrypointName(pkg, entrypointDir) {
  return normalizePath(path.join(pkg.name, path.relative(pkg.directory, path.resolve(pkg.directory, entrypointDir))));
}

function getDistNameWithStrategy(pkg, entrypointName, strategy) {
  if (strategy === "full") {
    return entrypointName.replace("@", "").replace(/\//g, "-");
  }

  return pkg.name.replace(/.*\//, "");
}

function getDistName(pkg, entrypointName, forceStrategy) {
  if (forceStrategy) {
    return getDistNameWithStrategy(pkg, entrypointName, forceStrategy);
  }

  if ("distFilenameStrategy" in pkg.project.json.preconstruct) {
    if (pkg.project.json.preconstruct.distFilenameStrategy !== "full" && pkg.project.json.preconstruct.distFilenameStrategy !== "unscoped-package-name") {
      throw new FatalError(`distFilenameStrategy is defined in your Preconstruct config as ${JSON.stringify(pkg.project.json.preconstruct.distFilenameStrategy)} but the only accepted values are "full" and "unscoped-package-name"`, pkg.project.name);
    }

    if (pkg.project.json.preconstruct.distFilenameStrategy === "unscoped-package-name") {
      return getDistNameWithStrategy(pkg, entrypointName, "unscoped-package-name");
    }
  }

  return getDistNameWithStrategy(pkg, entrypointName, "full");
}

const validFieldsFromPkg = {
  main(pkg, entrypointName, forceStrategy) {
    let safeName = getDistName(pkg, entrypointName, forceStrategy);
    return `dist/${safeName}.cjs.js`;
  },

  module(pkg, entrypointName, forceStrategy) {
    let safeName = getDistName(pkg, entrypointName, forceStrategy);
    return `dist/${safeName}.esm.js`;
  },

  "umd:main"(pkg, entrypointName, forceStrategy) {
    let safeName = getDistName(pkg, entrypointName, forceStrategy);
    return `dist/${safeName}.umd.min.js`;
  },

  browser(pkg, hasModuleBuild, entrypointName, forceStrategy) {
    let safeName = getDistName(pkg, entrypointName, forceStrategy);
    let obj = {
      [`./dist/${safeName}.cjs.js`]: `./dist/${safeName}.browser.cjs.js`
    };

    if (hasModuleBuild) {
      obj[`./dist/${safeName}.esm.js`] = `./dist/${safeName}.browser.esm.js`;
    }

    return obj;
  }

};
const validFields = {
  main(entrypoint, forceStrategy) {
    return validFieldsFromPkg.main(entrypoint.package, entrypoint.name, forceStrategy);
  },

  module(entrypoint, forceStrategy) {
    return validFieldsFromPkg.module(entrypoint.package, entrypoint.name, forceStrategy);
  },

  "umd:main"(entrypoint, forceStrategy) {
    return validFieldsFromPkg["umd:main"](entrypoint.package, entrypoint.name, forceStrategy);
  },

  browser(entrypoint, forceStrategy) {
    return validFieldsFromPkg.browser(entrypoint.package, entrypoint.json.module !== undefined, entrypoint.name, forceStrategy);
  }

};
function flowTemplate(hasDefaultExport, relativePath) {
  const escapedPath = JSON.stringify(relativePath);
  return `// @flow
export * from ${escapedPath};${hasDefaultExport ? `\nexport { default } from ${escapedPath};` : ""}\n`;
}
function tsTemplate(hasDefaultExport, relativePath) {
  const escapedPath = JSON.stringify(relativePath);
  return `export * from ${escapedPath};${hasDefaultExport ? `\nexport { default } from ${escapedPath};` : ""}\n`;
}

function _defineProperty$4(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function getFieldsUsedInEntrypoints(descriptors) {
  const fields = new Set(["main"]);

  for (let descriptor of descriptors) {
    if (descriptor.contents !== undefined) {
      let parsed = parseJson(descriptor.contents, descriptor.filename);

      for (let field of ["module", "umd:main", "browser"]) {
        if (parsed[field] !== undefined) {
          fields.add(field);
        }
      }
    }
  }

  return fields;
}

function getPlainEntrypointContent(pkg, fields, entrypointDir, indent) {
  const obj = {};

  for (const field of fields) {
    if (field === "browser") {
      obj[field] = validFieldsFromPkg[field](pkg, fields.has("module"), getEntrypointName(pkg, entrypointDir));
    } else {
      obj[field] = validFieldsFromPkg[field](pkg, getEntrypointName(pkg, entrypointDir));
    }
  }

  return JSON.stringify(obj, null, indent) + "\n";
}

function createEntrypoints(pkg, descriptors) {
  let fields = getFieldsUsedInEntrypoints(descriptors);
  return Promise.all(descriptors.map(async ({
    filename,
    contents,
    hasAccepted,
    sourceFile
  }) => {
    if (contents === undefined) {
      if (!hasAccepted) {
        const entrypointName = getEntrypointName(pkg, path__default.dirname(filename));
        let shouldCreateEntrypointPkgJson = await confirms.createEntrypointPkgJson({
          name: entrypointName
        });

        if (!shouldCreateEntrypointPkgJson) {
          throw new FatalError(errors.noEntrypointPkgJson, entrypointName);
        }
      }

      contents = getPlainEntrypointContent(pkg, fields, path__default.dirname(filename), pkg.indent);
      await fs.outputFile(filename, contents);
    }

    return new Entrypoint(filename, contents, pkg, sourceFile);
  }));
}

class Package extends Item {
  constructor(...args) {
    super(...args);

    _defineProperty$4(this, "project", void 0);

    _defineProperty$4(this, "entrypoints", void 0);
  }

  get configEntrypoints() {
    if (this.json.preconstruct.entrypoints === undefined) {
      return ["index.{js,jsx,ts,tsx}"];
    }

    if (Array.isArray(this.json.preconstruct.entrypoints) && this.json.preconstruct.entrypoints.every(x => typeof x === "string")) {
      return this.json.preconstruct.entrypoints;
    }

    throw new FatalError("The entrypoints option for this packages is not an array of globs", this.name);
  }

  static async create(directory, project, isFix) {
    let filePath = path__default.join(directory, "package.json");
    let contents = await fs.readFile(filePath, "utf-8");
    let pkg = new Package(filePath, contents, project._jsonDataByPath);
    pkg.project = project;
    let entrypoints = await fastGlob(pkg.configEntrypoints, {
      cwd: path__default.join(pkg.directory, "src"),
      onlyFiles: true,
      absolute: true
    });

    if (!entrypoints.length) {
      let oldEntrypoints = await fastGlob(pkg.configEntrypoints, {
        cwd: pkg.directory,
        onlyDirectories: true,
        absolute: true
      });

      if (oldEntrypoints.length) {
        throw new FatalError("this package has no entrypoints but it does have some using v1's entrypoints config, please see the the changelog for how to upgrade", pkg.name);
      }
    }

    pkg.entrypoints = await Promise.all(entrypoints.map(async sourceFile => {
      if (!/\.[tj]sx?$/.test(sourceFile)) {
        throw new FatalError(`entrypoint source files must end in .js, .jsx, .ts or .tsx but ${path__default.relative(pkg.directory, sourceFile)} does not`, pkg.name);
      }

      if (!normalizePath(sourceFile).includes(normalizePath(path__default.join(pkg.directory, "src")))) {
        throw new FatalError(`entrypoint source files must be inside of the src directory of a package but ${normalizePath(path__default.relative(pkg.directory, sourceFile))} is not`, pkg.name);
      }

      let directory = path__default.join(pkg.directory, path__default.resolve(sourceFile).replace(path__default.join(pkg.directory, "src"), "").replace(/\.[tj]sx?$/, ""));

      if (path__default.basename(directory) === "index") {
        directory = path__default.dirname(directory);
      }

      let filename = path__default.join(directory, "package.json");
      let contents = undefined;

      try {
        contents = await fs.readFile(filename, "utf-8");
      } catch (e) {
        if (e.code !== "ENOENT") {
          throw e;
        }
      }

      return {
        filename,
        contents,
        sourceFile,
        hasAccepted: isFix
      };
    })).then(async descriptors => {
      const globErrors = await getUselessGlobsThatArentReallyGlobsForNewEntrypoints(pkg.configEntrypoints, entrypoints, pkg.directory);

      if (globErrors.length) {
        let errors = globErrors.map(globError => {
          if (globError.exists) {
            return new FatalError(`specifies a entrypoint ${JSON.stringify(globError.glob)} but it is negated in the same config so it should be removed or the config should be fixed`, pkg.name);
          } else {
            return new FatalError(`specifies a entrypoint ${JSON.stringify(globError.glob)} but the file does not exist, please create it or fix the config`, pkg.name);
          }
        });

        if (errors.length) {
          throw new BatchError(errors);
        }
      }

      return createEntrypoints(pkg, descriptors);
    });
    const entrypointsWithSourcePath = new Map();

    for (const entrypoint of pkg.entrypoints) {
      if (entrypoint.json.preconstruct.source !== undefined) {
        throw new FatalError("The source option on entrypoints no longer exists, see the changelog for how to upgrade to the new entrypoints config", this.name);
      }

      if (entrypointsWithSourcePath.has(entrypoint.name)) {
        throw new FatalError(`this package has multiple source files for the same entrypoint of ${entrypoint.name} at ${normalizePath(path__default.relative(pkg.directory, entrypointsWithSourcePath.get(entrypoint.name)))} and ${normalizePath(path__default.relative(pkg.directory, entrypoint.source))}`, pkg.name);
      }

      entrypointsWithSourcePath.set(entrypoint.name, entrypoint.source);
    }

    return pkg;
  }

  setFieldOnEntrypoints(field) {
    this.entrypoints.forEach(entrypoint => {
      entrypoint.json = setFieldInOrder(entrypoint.json, field, validFields[field](entrypoint));
    });
  }

  get name() {
    if (typeof this.json.name !== "string") {
      throw new FatalError("The name field on this package is not a string", this.directory);
    }

    return this.json.name;
  }

}

async function validateIncludedFiles(pkg) {
  try {
    const rootDistDirectoryTestFilepath = path__default.join(pkg.directory, "dist", "preconstruct-test-file");
    const hasNoEntrypointAtRootOfPackage = pkg.entrypoints.every(entrypoint => entrypoint.directory !== pkg.directory);
    await Promise.all(pkg.entrypoints.map(async entrypoint => {
      let filename = path__default.join(entrypoint.directory, "dist", "preconstruct-test-file");
      return fs.outputFile(filename, "test content");
    }).concat(hasNoEntrypointAtRootOfPackage ? fs.outputFile(rootDistDirectoryTestFilepath, "test content") : []));
    let packedFilesArr = await packlist({
      path: pkg.directory
    }); // Ensure consistent path separators. Without this, there's a mismatch between this result and the path it
    // checks on Windows. This value will have a forward slash (dist/preconstruct-test-file), whereas the value
    // of distFilePath below will have a backslash (dist\preconstruct-test-file). Obviously these two won't match,
    // so the distfile check will fail.

    let result = new Set(packedFilesArr.map(p => path__default.normalize(p))); // check that we're including the package.json and main file
    // TODO: add Flow and TS check and if they're ignored, don't write them

    let messages = [];
    pkg.entrypoints.forEach(entrypoint => {
      let pkgJsonPath = path__default.relative(pkg.directory, path__default.resolve(entrypoint.directory, "package.json"));
      let distFilePath = path__default.relative(pkg.directory, path__default.resolve(entrypoint.directory, "dist", "preconstruct-test-file"));
      let entrypointName = path__default.relative(pkg.directory, entrypoint.directory);

      if (!result.has(pkgJsonPath)) {
        messages.push(`the entrypoint ${chalk.cyan(entrypointName)} isn't included in the published files for this package, please add it to the files field in the package's package.json`);
      } else if (!result.has(distFilePath)) {
        messages.push(`the dist directory ${entrypointName === "" ? "" : `for entrypoint ${chalk.cyan(entrypointName)} `}isn't included in the published files for this package, please add it to the files field in the package's package.json`);
      }
    });

    if (hasNoEntrypointAtRootOfPackage && !result.has(path__default.relative(pkg.directory, rootDistDirectoryTestFilepath))) {
      messages.push("the dist directory in the root of the package isn't included in the published files for this package, please add it to the files field in the package's package.json.\nthough this package does not have an entrypoint at the root of the package, preconstruct will write common chunks to the root dist directory so it must be included.");
    }

    if (messages.length) {
      throw new FatalError(messages.join("\n"), pkg.name);
    }
  } finally {
    await Promise.all(pkg.entrypoints.map(entrypoint => fs.remove(path__default.join(entrypoint.directory, "dist", "preconstruct-test-file"))));
  }
}

function _defineProperty$5(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const allSettled = promises => Promise.all(promises.map(promise => promise.then(value => ({
  status: "fulfilled",
  value
}), reason => ({
  status: "rejected",
  reason
}))));

class Project extends Item {
  constructor(...args) {
    super(...args);

    _defineProperty$5(this, "packages", void 0);
  }

  get experimentalFlags() {
    let config = this.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH || {};
    return {
      logCompiledFiles: !!config.logCompiledFiles,
      typeScriptProxyFileWithImportEqualsRequireAndExportEquals: !!config.typeScriptProxyFileWithImportEqualsRequireAndExportEquals,
      keepDynamicImportAsDynamicImportInCommonJS: !!config.keepDynamicImportAsDynamicImportInCommonJS
    };
  }

  get configPackages() {
    if (this.json.preconstruct.packages === undefined) {
      return ["."];
    }

    if (Array.isArray(this.json.preconstruct.packages) && this.json.preconstruct.packages.every(x => typeof x === "string")) {
      return this.json.preconstruct.packages;
    }

    throw new FatalError("The packages option for this project is not an array of globs", this.name);
  }

  static async create(_directory, isFix = false) {
    const directory = await fs.realpath.native(_directory);
    let filePath = path__default.join(directory, "package.json");
    let contents = await fs.readFile(filePath, "utf-8");
    let project = new Project(filePath, contents, new Map());
    project.packages = await project._packages(isFix);
    return project;
  }

  get name() {
    if (typeof this.json.name !== "string") {
      throw new FatalError("The name field on this project is not a string", this.directory);
    }

    return this.json.name;
  }

  async _packages(isFix) {
    // suport bolt later probably
    // maybe lerna too though probably not
    if (!this.json.preconstruct.packages && this.json.workspaces) {
      let workspaces;

      if (Array.isArray(this.json.workspaces)) {
        workspaces = this.json.workspaces;
      } else if (Array.isArray(this.json.workspaces.packages)) {
        workspaces = this.json.workspaces.packages;
      }

      let packages = await promptInput("what packages should preconstruct build?", this, workspaces.join(","));
      this.json.preconstruct.packages = packages.split(",");
      await this.save();
    }

    let filenames = await fastGlob(this.configPackages, {
      cwd: this.directory,
      onlyDirectories: true,
      absolute: true
    });
    let packages = [];
    await Promise.all(filenames.map(async x => {
      try {
        packages.push((await Package.create(x, this, isFix)));
      } catch (err) {
        if (err.code === "ENOENT" && err.path === path__default.join(x, "package.json")) {
          return;
        }

        throw err;
      }
    }));
    const errored = (await allSettled(packages.map(pkg => validateIncludedFiles(pkg)))).find(result => result.status === "rejected");

    if (errored) {
      // TS can't refine type based on .find predicate
      throw errored.reason;
    }

    return packages;
  }

}

let keys = Object.keys;
async function fixPackage(pkg) {
  if (pkg.entrypoints.length === 0) {
    throw new FatalError(errors.noEntrypoints, pkg.name);
  }

  let fields = {
    main: true,
    module: pkg.entrypoints.some(x => x.json.module !== undefined),
    "umd:main": pkg.entrypoints.some(x => x.json["umd:main"] !== undefined),
    browser: pkg.entrypoints.some(x => x.json.browser !== undefined)
  };
  keys(fields).filter(x => fields[x]).forEach(field => {
    pkg.setFieldOnEntrypoints(field);
  });
  return (await Promise.all(pkg.entrypoints.map(x => x.save()))).some(x => x);
}
let unsafeRequire = require;
function validatePackage(pkg) {
  if (pkg.entrypoints.length === 0) {
    throw new FatalError(errors.noEntrypoints, pkg.name);
  }

  let fields = {
    // main is intentionally not here, since it's always required
    // it will be validated in validateEntrypoint and the case
    // which this function validates will never happen
    module: pkg.entrypoints[0].json.module !== undefined,
    "umd:main": pkg.entrypoints[0].json["umd:main"] !== undefined,
    browser: pkg.entrypoints[0].json.browser !== undefined
  };
  pkg.entrypoints.forEach(entrypoint => {
    keys(fields).forEach(field => {
      if (entrypoint.json[field] && !fields[field]) {
        throw new FixableError(`${entrypoint.name} has a ${field} build but ${pkg.entrypoints[0].name} does not have a ${field} build. Entrypoints in a package must either all have a particular build type or all not have a particular build type.`, pkg.name);
      }

      if (!entrypoint.json[field] && fields[field]) {
        throw new FixableError(`${pkg.entrypoints[0].name} has a ${field} build but ${entrypoint.name} does not have a ${field} build. Entrypoints in a package must either all have a particular build type or all not have a particular build type.`, pkg.name);
      }
    });
  }); // TODO: do this well

  if (fields["umd:main"]) {
    // this is a sorta naive check
    // but it's handling the most common case
    // i don't think it's worth implementing this well at this exact moment
    // because i'm guessing doing it well would cause more problems than it would solve
    // this will likely change in the future
    let sortaAllDeps = new Set([...(pkg.json.peerDependencies ? Object.keys(pkg.json.peerDependencies) : []), ...(pkg.json.dependencies ? Object.keys(pkg.json.dependencies) : [])]);

    for (let depName in pkg.json.dependencies) {
      let depPkgJson;

      try {
        depPkgJson = unsafeRequire(resolveFrom(pkg.directory, depName + "/package.json"));
      } catch (err) {
        // ideally we'd resolve the packages ignoring the exports field but emitting
        // the peer dependency error thing below isn't that important
        // and having this be not broken for now is better
        if (err.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
          continue;
        }

        throw err;
      }

      if (depPkgJson.peerDependencies) {
        for (let pkgName in depPkgJson.peerDependencies) {
          if (!sortaAllDeps.has(pkgName)) {
            throw new FatalError(`the package ${chalk.blue(pkg.name)} depends on ${chalk.blue(depName)} which has a peerDependency on ${chalk.blue(pkgName)} but ${chalk.blue(pkgName)} is not specified in the dependencies or peerDependencies of ${chalk.blue(pkg.name)}. please add ${chalk.blue(pkgName)} to the dependencies or peerDependencies of ${chalk.blue(pkg.name)}`, pkg.name);
          }
        }
      }
    }
  }
}

// just does validation
// used in build and watch

const isFieldValid = {
  main(entrypoint) {
    return entrypoint.json.main === validFields.main(entrypoint);
  },

  module(entrypoint) {
    return entrypoint.json.module === validFields.module(entrypoint);
  },

  "umd:main"(entrypoint) {
    return entrypoint.json["umd:main"] === validFields["umd:main"](entrypoint);
  },

  browser(entrypoint) {
    return equal(entrypoint.json.browser, validFields.browser(entrypoint));
  }

};
function isUmdNameSpecified(entrypoint) {
  return typeof entrypoint.json.preconstruct.umdName === "string";
}
let projectsShownOldDistNamesInfo = new WeakSet();

function validateEntrypoint(entrypoint, log) {
  if (log) {
    info(infos.validEntrypoint, entrypoint.name);
  }

  const fatalErrors = [];

  for (const field of ["main", "module", "umd:main", "browser"]) {
    if (field !== "main" && entrypoint.json[field] === undefined) {
      continue;
    }

    if (!isFieldValid[field](entrypoint)) {
      let isUsingOldDistFilenames = validFields[field](entrypoint, "unscoped-package-name") === entrypoint.json[field];

      if (isUsingOldDistFilenames && !projectsShownOldDistNamesInfo.has(entrypoint.package.project)) {
        projectsShownOldDistNamesInfo.add(entrypoint.package.project);
        info(`it looks like you're using the dist filenames of Preconstruct v1, the default dist filename strategy has changed in v2`);
        info(`you can run ${chalk.green("preconstruct fix")} to use the new dist filenames`);
        info('if you want to keep the dist filename strategy of v1, add `"distFilenameStrategy": "unscoped-package-name"` to the Preconstruct config in your root package.json');
      }

      fatalErrors.push( // they're both fixable but we don't want the message about running preconstruct fix if they're using the old dist file names since we have a custom message
      new (isUsingOldDistFilenames ? FatalError : FixableError)(errors.invalidField(field, entrypoint.json[field], validFields[field](entrypoint)), entrypoint.name));
    }

    if (field === "umd:main" && !isUmdNameSpecified(entrypoint)) {
      fatalErrors.push(new FixableError(errors.umdNameNotSpecified, entrypoint.name));
    }

    if (log && !fatalErrors.length) {
      info(infos.validField(field), entrypoint.name);
    }
  }

  if (fatalErrors.length) {
    throw new BatchError(fatalErrors);
  }
}

const FORMER_FLAGS_THAT_ARE_ENABLED_NOW = new Set(["newEntrypoints", "newDistFilenames", "newProcessEnvNodeEnvReplacementStrategyAndSkipTerserOnCJSProdBuild"]);
const EXPERIMENTAL_FLAGS = new Set(["logCompiledFiles", "typeScriptProxyFileWithImportEqualsRequireAndExportEquals", "keepDynamicImportAsDynamicImportInCommonJS"]);
function validateProject(project, log = false) {
  let errors = [];

  if (project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH) {
    Object.keys(project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH).forEach(key => {
      if (FORMER_FLAGS_THAT_ARE_ENABLED_NOW.has(key)) {
        errors.push(new FixableError(`The behaviour from the experimental flag ${JSON.stringify(key)} is the current behaviour now, the flag should be removed`, project.name));
      } else if (!EXPERIMENTAL_FLAGS.has(key)) {
        errors.push(new FatalError(`The experimental flag ${JSON.stringify(key)} in your config does not exist`, project.name));
      }
    });
  }

  for (let pkg of project.packages) {
    try {
      validatePackage(pkg);
    } catch (err) {
      if (err instanceof BatchError) {
        errors.push(...err.errors);
      } else if (err instanceof FatalError) {
        errors.push(err);
      } else {
        throw err;
      }
    }

    for (let entrypoint of pkg.entrypoints) {
      try {
        validateEntrypoint(entrypoint, log);
      } catch (err) {
        if (err instanceof BatchError) {
          errors.push(...err.errors);
        } else if (err instanceof FatalError) {
          errors.push(err);
        } else {
          throw err;
        }
      }
    }
  }

  if (errors.length) {
    if (errors.length === 1) {
      throw errors[0];
    }

    throw new BatchError(errors);
  }
}
async function validate(directory) {
  let project = await Project.create(directory);
  validateProject(project, true);
  success(successes.validProject);
}

async function doInit(pkg) {
  if (pkg.entrypoints.every(entrypoint => isFieldValid.main(entrypoint))) {
    info(infos.validField("main"), pkg.name);
  } else {
    let canWriteMainField = await confirms.writeMainField(pkg);

    if (!canWriteMainField) {
      throw new FatalError(errors.deniedWriteMainField, pkg.name);
    }

    pkg.setFieldOnEntrypoints("main");
  }

  let allEntrypointsAreMissingAModuleField = pkg.entrypoints.every(entrypoint => entrypoint.json.module === undefined);
  let someEntrypointsAreNotValid = pkg.entrypoints.some(entrypoint => !isFieldValid.module(entrypoint));

  if (allEntrypointsAreMissingAModuleField || someEntrypointsAreNotValid) {
    let canWriteModuleField = await confirms.writeModuleField(pkg);

    if (canWriteModuleField) {
      pkg.setFieldOnEntrypoints("module");
    } else if (!allEntrypointsAreMissingAModuleField) {
      throw new FixableError(errors.fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit("module"), pkg.name);
    }
  } else {
    info(infos.validField("module"), pkg.name);
  }

  let someEntrypointsHaveAMaybeInvalidUmdBuild = pkg.entrypoints.some(entrypoint => entrypoint.json["umd:main"] !== undefined);
  let someUmdMainFieldsAreInvalid = pkg.entrypoints.some(entrypoint => !isFieldValid["umd:main"](entrypoint));
  let someUmdNamesAreNotSpecified = pkg.entrypoints.some(entrypoint => !isUmdNameSpecified(entrypoint));

  if (someEntrypointsHaveAMaybeInvalidUmdBuild && (someUmdMainFieldsAreInvalid || someUmdNamesAreNotSpecified)) {
    let shouldWriteUMDBuilds = await confirms.fixUmdBuild(pkg);

    if (shouldWriteUMDBuilds) {
      pkg.setFieldOnEntrypoints("umd:main");

      for (let entrypoint of pkg.entrypoints) {
        let umdName = await promptInput(inputs.getUmdName, entrypoint);
        entrypoint.json.preconstruct.umdName = umdName;
      }
    } else {
      throw new FixableError(errors.fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit("umd:main"), pkg.name);
    }
  }

  let someEntrypointsHaveABrowserField = pkg.entrypoints.some(entrypoint => entrypoint.json.browser !== undefined);
  let someEntrypointsHaveAnInvalidBrowserField = pkg.entrypoints.some(entrypoint => !isFieldValid.browser(entrypoint));

  if (someEntrypointsHaveABrowserField && someEntrypointsHaveAnInvalidBrowserField) {
    let shouldFixBrowserField = await confirms.fixBrowserField(pkg);

    if (shouldFixBrowserField) {
      pkg.setFieldOnEntrypoints("browser");
    } else {
      throw new FixableError(errors.fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit("browser"), pkg.name);
    }
  }

  await Promise.all(pkg.entrypoints.map(x => x.save()));
}

async function init(directory) {
  let project = await Project.create(directory);
  await Promise.all(project.packages.map(doInit));
  success("initialised project!");
}

function getAliases(project) {
  let aliases = {};
  project.packages.forEach(pkg => {
    pkg.entrypoints.forEach(entrypoint => {
      aliases[entrypoint.name] = entrypoint.source;
    });
  });
  return aliases;
}

const pattern = /from (["'])@babel\/runtime(|-corejs[23])\/helpers\/(\w+)["']/g;
function rewriteBabelRuntimeHelpers() {
  return {
    name: "rewrite-babel-runtime-helpers",

    renderChunk(code, chunkInfo, {
      format
    }) {
      if (format !== "es") {
        return null;
      }

      return code.replace(pattern, (_, quote, maybeCorejsBit, path) => {
        return `from ${quote}@babel/runtime${maybeCorejsBit}/helpers/esm/${path}${quote}`;
      });
    }

  };
}

function getDiagnosticsHost(ts, projectDir) {
  return {
    getCanonicalFileName: x => ts.sys.useCaseSensitiveFileNames ? x : x.toLowerCase(),
    getCurrentDirectory: () => projectDir,
    getNewLine: () => os.EOL
  };
}
function loadTypeScript(packageDir, projectDir, pkgName) {
  try {
    return require(resolveFrom(packageDir, "typescript"));
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      try {
        // if people have typescript installed at the their project and they're using Yarn PnP,
        // typescript won't be resolvable at the package level but it will be resolvable at the project level
        // (note this will only happen with PnP)
        return require(resolveFrom(projectDir, "typescript"));
      } catch (err) {
        throw new FatalError("an entrypoint source file ends with the .ts or .tsx extension but the typescript module could not be resolved from the project directory, please install it.", pkgName);
      }
    }

    throw err;
  }
}

function weakMemoize(func) {
  let cache = new WeakMap();
  return arg => {
    if (cache.has(arg)) {
      return cache.get(arg);
    }

    let ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
}

function memoize(fn) {
  const cache = {};
  return arg => {
    if (cache[arg] === undefined) cache[arg] = fn(arg);
    return cache[arg];
  };
}

async function nonMemoizedGetProgram(typescript, configFileName) {
  let configFileContents = await fs.readFile(configFileName, "utf8");
  const result = typescript.parseConfigFileTextToJson(configFileName, configFileContents);
  let thing = typescript.parseJsonConfigFileContent(result.config, typescript.sys, process.cwd(), undefined, configFileName);
  thing.options.declaration = true;
  thing.options.emitDeclarationOnly = true;
  thing.options.noEmit = false;
  let program = typescript.createProgram(thing.fileNames, thing.options);
  return {
    options: thing.options,
    program
  };
}

let memoizedGetProgram = weakMemoize(typescript => memoize(async configFileName => {
  return nonMemoizedGetProgram(typescript, configFileName);
}));
async function getProgram(dirname, pkgName, ts) {
  let configFileName = ts.findConfigFile(dirname, ts.sys.fileExists);

  if (!configFileName) {
    throw new FatalError("an entrypoint source file ends with the .ts or tsx extension but no TypeScript config exists, please create one.", pkgName);
  } // if the tsconfig is inside the package directory, let's not memoize getting the ts service
  // since it'll only ever be used once
  // and if we keep it, we could run out of memory for large projects
  // if the tsconfig _isn't_ in the package directory though, it's probably fine to memoize it
  // since it should just be a root level tsconfig


  return normalizePath(configFileName) === normalizePath(path__default.join(dirname, "tsconfig.json")) ? nonMemoizedGetProgram(ts, configFileName) : memoizedGetProgram(ts)(configFileName);
}
const getDeclarationsForFile = async (filename, typescript, program, normalizedPkgDir, projectDir, diagnosticsHost) => {
  if (filename.endsWith(".d.ts")) {
    return {
      types: {
        name: filename.replace(normalizedPkgDir, normalizePath(path__default.join(normalizedPkgDir, "dist", "declarations"))),
        content: await fs.readFile(filename, "utf8")
      },
      filename
    };
  }

  const sourceFile = program.getSourceFile(typescript.sys.useCaseSensitiveFileNames ? filename : filename.toLowerCase());

  if (!sourceFile) {
    throw new Error(`Could not find source file at ${filename} in TypeScript declaration generation, this is likely a bug in Preconstruct`);
  }

  const emitted = {};
  const otherEmitted = [];
  const {
    diagnostics
  } = program.emit(sourceFile, (name, text) => {
    if (name.endsWith(".d.ts")) {
      emitted.types = {
        name: name.replace(normalizedPkgDir, normalizePath(path__default.join(normalizedPkgDir, "dist", "declarations"))),
        content: text
      };
    } else if (name.endsWith(".d.ts.map")) {
      emitted.map = {
        name: name.replace(normalizedPkgDir, normalizePath(path__default.join(normalizedPkgDir, "dist", "declarations"))),
        content: text
      };
    } else {
      otherEmitted.push({
        name,
        text
      });
    }
  }, undefined, true);

  if (!emitted.types || diagnostics.length) {
    throw new FatalError(`Generating TypeScript declarations for ${normalizePath(path__default.relative(projectDir, filename))} failed:\n${typescript.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost)}${otherEmitted.length ? `\n\nTypeScript emitted other files when attempting to emit .d.ts files:\n${otherEmitted.map(x => `${x.name}\n\n${x.text}`).join("\n\n")}` : ""}`, "");
  }

  return {
    types: emitted.types,
    map: emitted.map,
    filename
  };
};
function overwriteDeclarationMapSourceRoot(content, actualSourceRoot) {
  const src = JSON.parse(content);
  src.sourceRoot = actualSourceRoot;
  return JSON.stringify(src);
}

async function getDeclarations(dirname, pkgName, projectDir, entrypoints) {
  const typescript = loadTypeScript(dirname, projectDir, pkgName);
  const {
    program,
    options
  } = await getProgram(dirname, pkgName, typescript);
  let moduleResolutionCache = typescript.createModuleResolutionCache(dirname, x => x, options);
  let normalizedDirname = normalizePath(dirname);
  let resolvedEntrypointPaths = entrypoints.map(x => {
    let {
      resolvedModule
    } = typescript.resolveModuleName(path__default.join(path__default.dirname(x), path__default.basename(x, path__default.extname(x))), dirname, options, typescript.sys, moduleResolutionCache);

    if (!resolvedModule) {
      throw new Error("This is an internal error, please open an issue if you see this: ts could not resolve module");
    }

    return resolvedModule.resolvedFileName;
  });
  let allDeps = new Set(resolvedEntrypointPaths);

  function searchDeps(deps) {
    for (let dep of deps) {
      let sourceFile = program.getSourceFile(dep);

      if (!sourceFile) {
        throw new FatalError(`Could not generate type declarations because ${dep} is not in a TypeScript project. Make sure this file is included in your tsconfig.`, pkgName);
      }

      let internalDeps = new Set();

      for (let {
        text
      } of sourceFile.imports) {
        let {
          resolvedModule
        } = typescript.resolveModuleName(text, dep, options, typescript.sys, moduleResolutionCache);

        if (resolvedModule) {
          if (!allDeps.has(resolvedModule.resolvedFileName) && !resolvedModule.isExternalLibraryImport && resolvedModule.resolvedFileName.includes(normalizedDirname) && // you can import a .json file if you have resolveJsonModule: true in your tsconfig
          // but you can't generate declarations for it(which seems fine and good i think?)
          // and just ignoring imports to them seems fine because from what i can tell
          // typescript inlines the types for them if the json file import is used in the files exports
          !resolvedModule.resolvedFileName.endsWith(".json")) {
            internalDeps.add(resolvedModule.resolvedFileName);
            allDeps.add(resolvedModule.resolvedFileName);
          }
        }
      }

      searchDeps(internalDeps);
    }
  }

  searchDeps(new Set(resolvedEntrypointPaths));
  const diagnosticsHost = getDiagnosticsHost(typescript, projectDir);
  return Promise.all([...allDeps].map(filename => {
    return getDeclarationsForFile(filename, typescript, program, normalizedDirname, projectDir, diagnosticsHost);
  }));
}

let isTsPath = source => /\.tsx?/.test(source);
function typescriptDeclarations(pkg) {
  if (!pkg.entrypoints.some(({
    source
  }) => isTsPath(source))) {
    return {
      name: "typescript-declarations"
    };
  }

  return {
    name: "typescript-declarations",

    async generateBundle(opts, bundle) {
      let declarations = await getDeclarations(pkg.directory, pkg.name, pkg.project.directory, pkg.entrypoints.map(x => x.source));
      let srcFilenameToDtsFilenameMap = new Map();
      await Promise.all([...declarations].map(async output => {
        srcFilenameToDtsFilenameMap.set(normalizePath(output.filename), output.types.name);
        this.emitFile({
          type: "asset",
          fileName: path__default.relative(opts.dir, output.types.name),
          source: output.types.content
        });

        if (output.map) {
          const sourceRoot = normalizePath(path__default.dirname(path__default.relative(path__default.dirname(output.map.name), output.filename)));
          const source = overwriteDeclarationMapSourceRoot(output.map.content, sourceRoot);
          this.emitFile({
            type: "asset",
            fileName: path__default.relative(opts.dir, output.map.name),
            source
          });
        }
      }));

      for (const n in bundle) {
        const file = bundle[n];

        if (file.type === "asset" || !file.isEntry || file.facadeModuleId == null) {
          continue;
        }

        const facadeModuleId = file.facadeModuleId;
        let dtsFilename = srcFilenameToDtsFilenameMap.get(normalizePath(facadeModuleId));

        if (!dtsFilename) {
          throw new FatalError(`no .d.ts file was found for the entrypoint at ${facadeModuleId}`, pkg.name);
        }

        let mainFieldPath = file.fileName.replace(/\.prod\.js$/, "");
        let relativeToSource = path__default.relative(path__default.dirname(path__default.join(opts.dir, file.fileName)), dtsFilename.replace(/\.d\.ts$/, ""));

        if (!relativeToSource.startsWith(".")) {
          relativeToSource = `./${relativeToSource}`;
        }

        let tsFileSource = tsTemplate(file.exports.includes("default"), normalizePath(relativeToSource));
        let tsFileName = mainFieldPath + ".d.ts";
        this.emitFile({
          type: "asset",
          fileName: tsFileName,
          source: tsFileSource
        });
      }
    }

  };
}

let tsExtensionPattern = /tsx?$/;

async function getTypeSystem(entrypoint) {
  let content = await fs.readFile(entrypoint.source, "utf8");

  if (tsExtensionPattern.test(entrypoint.source)) {
    return ["typescript", content];
  } // TODO: maybe we should write the flow symlink even if there isn't an @flow
  // comment so that if someone adds an @flow comment they don't have to run preconstruct dev again


  if (content.includes("@flow")) {
    return ["flow", content];
  }

  return [undefined, content];
}

async function entrypointHasDefaultExport(entrypoint, content) {
  // this regex won't tell us that a module definitely has a default export
  // if it doesn't match though, it will tell us that the module
  // definitely _doesn't_ have a default export
  // we want to do this because a Babel parse is very expensive
  // so we want to avoid doing it unless we absolutely have to
  if (!/(export\s*{[^}]*default|export\s+(|\*\s+as\s+)default\s)/.test(content)) {
    return false;
  }

  let ast = await babel.parseAsync(content, {
    filename: entrypoint.source,
    sourceType: "module",
    cwd: entrypoint.package.project.directory
  });

  for (let statement of ast.program.body) {
    if (statement.type === "ExportDefaultDeclaration" || statement.type === "ExportNamedDeclaration" && statement.specifiers.some(specifier => (specifier.type === "ExportDefaultSpecifier" || specifier.type === "ExportNamespaceSpecifier" || specifier.type === "ExportSpecifier") && specifier.exported.name === "default")) {
      return true;
    }
  }

  return false;
}

async function writeDevTSFile(entrypoint, entrypointSourceContent) {
  let cjsDistPath = path__default.join(entrypoint.directory, validFields.main(entrypoint)).replace(/\.js$/, ".d.ts");
  let output = await (entrypoint.package.project.experimentalFlags.typeScriptProxyFileWithImportEqualsRequireAndExportEquals ? `import mod = require(${JSON.stringify(normalizePath(path__default.relative(path__default.dirname(cjsDistPath), entrypoint.source).replace(/\.tsx?$/, "")))});\n\nexport = mod;\n` : entrypointHasDefaultExport(entrypoint, entrypointSourceContent).then(hasDefaultExport => `// are you seeing an error that a default export doesn't exist but your source file has a default export?
// you should run \`yarn\` or \`yarn preconstruct dev\` if preconstruct dev isn't in your postinstall hook

// curious why you need to?
// this file exists so that you can import from the entrypoint normally
// except that it points to your source file and you don't need to run build constantly
// which means we need to re-export all of the modules from your source file
// and since export * doesn't include default exports, we need to read your source file
// to check for a default export and re-export it if it exists
// it's not ideal, but it works pretty well ¯\\_(ツ)_/¯
` + tsTemplate(hasDefaultExport, normalizePath(path__default.relative(path__default.dirname(cjsDistPath), entrypoint.source).replace(/\.tsx?$/, "")))));
  await fs.outputFile(cjsDistPath, output);
}

async function writeTypeSystemFile(typeSystemPromise, entrypoint) {
  let [typeSystem, content] = await typeSystemPromise;
  if (typeSystem === undefined) return;
  let cjsDistPath = path__default.join(entrypoint.directory, validFields.main(entrypoint));

  if (typeSystem === "flow") {
    // so...
    // you might have noticed that this passes
    // hasExportDefault=false
    // and be thinking that default exports
    // but flow seems to be
    // then you might ask, if re-exporting the default
    // export isn't necessary, why do it for actual builds?
    // the reason is is that if preconstruct dev breaks because
    // of a new version of flow that changes this, that's mostly okay
    // because preconstruct dev can be fixed, a consumer can upgrade it
    // and then everything is fine but if a production build is broken
    // a consumer would have to do a new release and that's not ideal
    await fs.writeFile(cjsDistPath + ".flow", flowTemplate(false, normalizePath(path__default.relative(path__default.dirname(cjsDistPath), entrypoint.source))));
  }

  if (typeSystem === "typescript") {
    await writeDevTSFile(entrypoint, content);
  }
}

async function dev(projectDir) {
  let project = await Project.create(projectDir);
  validateProject(project);
  info("project is valid!");
  let promises = [];
  await Promise.all(project.packages.map(pkg => {
    return Promise.all(pkg.entrypoints.map(async entrypoint => {
      let typeSystemPromise = getTypeSystem(entrypoint);
      let distDirectory = path__default.join(entrypoint.directory, "dist");
      await fs.remove(distDirectory);
      await fs.ensureDir(distDirectory);
      let promises = [writeTypeSystemFile(typeSystemPromise, entrypoint), fs.writeFile(path__default.join(entrypoint.directory, validFields.main(entrypoint)), `"use strict";
// this file might look strange and you might be wondering what it's for
// it's lets you import your source files by importing this entrypoint
// as you would import it if it was built with preconstruct build
// this file is slightly different to some others though
// it has a require hook which compiles your code with Babel
// this means that you don't have to set up @babel/register or anything like that
// but you can still require this module and it'll be compiled

// this bit of code imports the require hook and registers it
let unregister = require(${JSON.stringify(normalizePath(path__default.relative(distDirectory, path__default.dirname(require.resolve("@preconstruct/hook")))))}).___internalHook(typeof __dirname === 'undefined' ? undefined : __dirname, ${JSON.stringify(normalizePath(path__default.relative(distDirectory, project.directory)))}, ${JSON.stringify(normalizePath(path__default.relative(distDirectory, pkg.directory)))});

// this re-exports the source file
module.exports = require(${JSON.stringify(normalizePath(path__default.relative(distDirectory, entrypoint.source)))});

unregister();
`)];

      if (entrypoint.json.module) {
        promises.push(fs.symlink(entrypoint.source, path__default.join(entrypoint.directory, validFields.module(entrypoint))));
      }

      if (entrypoint.json.browser) {
        let browserField = validFields.browser(entrypoint);

        for (let key of Object.keys(browserField)) {
          promises.push(fs.symlink(entrypoint.source, path__default.join(entrypoint.directory, browserField[key])));
        }
      }

      return Promise.all(promises);
    }));
  }));
  await Promise.all(promises);
  success("created links!");
}

function getDevPath(cjsPath) {
  return cjsPath.replace(/\.js$/, ".dev.js");
}
function getProdPath(cjsPath) {
  return cjsPath.replace(/\.js$/, ".prod.js");
}
async function cleanProjectBeforeBuild(project) {
  await Promise.all(project.packages.map(async pkg => {
    await Promise.all([fs.remove(path__default.join(pkg.directory, "dist")), ...pkg.entrypoints.filter(entrypoint => entrypoint.name !== pkg.name).map(entrypoint => {
      return fs.remove(path__default.join(entrypoint.directory, "dist"));
    })]);
    await Promise.all(pkg.entrypoints.map(async entrypoint => {
      if (isTsPath(entrypoint.source)) {
        await fs.mkdir(path__default.join(entrypoint.directory, "dist"));
        await writeDevTSFile(entrypoint, (await fs.readFile(entrypoint.source, "utf8")));
      }
    }));
  }));
}

function flowAndNodeDevProdEntry(pkg, warnings) {
  // let directorySourceFilesMustBeIn = pkg.project.experimentalFlags
  //   .newEntrypoints
  //   ? path.resolve(pkg.directory, "src")
  //   : pkg.directory;
  return {
    name: "flow-and-prod-dev-entry",

    load(id) {
      if (id === "could-not-resolve") {
        return "";
      }

      return null;
    },

    async resolveId(source, importer) {
      let resolved = await this.resolve(source, importer, {
        skipSelf: true
      });

      if (resolved === null) {
        if (!source.startsWith(".")) {
          warnings.push(new FatalError(`"${source}" is imported ${importer ? `by "${normalizePath(path__default.relative(pkg.directory, importer))}"` : ""} but the package is not specified in dependencies or peerDependencies`, pkg.name));
          return "could-not-resolve";
        }

        throw new FatalError(`Could not resolve ${source} ` + (importer ? `from ${path__default.relative(pkg.directory, importer)}` : ""), pkg.name);
      }

      if (source.startsWith("\0") || resolved.id.startsWith("\0") || resolved.id.startsWith(pkg.directory)) {
        return resolved;
      }

      warnings.push(new FatalError(`all relative imports in a package should only import modules inside of their package directory but ${importer ? `"${normalizePath(path__default.relative(pkg.directory, importer))}"` : "a module"} is importing "${source}"`, pkg.name));
      return "could-not-resolve";
    },

    async generateBundle(opts, bundle) {
      for (const n in bundle) {
        const file = bundle[n];

        if (file.type === "asset" || !(file.type === "chunk" && file.isEntry) || file.facadeModuleId == null) {
          continue;
        }

        let mainFieldPath = file.fileName.replace(/\.prod\.js$/, ".js");
        let relativeToSource = path__default.relative(path__default.dirname(path__default.join(opts.dir, file.fileName)), file.facadeModuleId);
        let isEntrySourceTypeScript = /\.tsx?$/.test(file.facadeModuleId);

        if (!isEntrySourceTypeScript) {
          let flowMode = false;
          let source = await fs.readFile(file.facadeModuleId, "utf8");

          if (source.includes("@flow")) {
            flowMode = file.exports.includes("default") ? "all" : "named";
          }

          if (flowMode !== false) {
            let flowFileSource = flowTemplate(flowMode === "all", normalizePath(relativeToSource));
            let flowFileName = mainFieldPath + ".flow";
            this.emitFile({
              type: "asset",
              fileName: flowFileName,
              source: flowFileSource
            });
          }
        }

        let mainEntrySource = `'use strict';

if (${// tricking static analysis is fun...
        "process" + ".env.NODE_ENV"} === "production") {
  module.exports = require("./${path__default.basename(getProdPath(mainFieldPath))}");
} else {
  module.exports = require("./${path__default.basename(getDevPath(mainFieldPath))}");
}\n`;
        this.emitFile({
          type: "asset",
          fileName: mainFieldPath,
          source: mainEntrySource
        });
      }
    }

  };
}

let shouldUseWorker = process.env.DISABLE_PRECONSTRUCT_WORKER !== "true" && process.env.NODE_ENV !== "test" && !isCI;
let worker;
let unsafeRequire$1 = require;
function createWorker() {
  if (shouldUseWorker) {
    worker = new Worker(require.resolve("@preconstruct/cli/worker"));
  } else {
    worker = unsafeRequire$1("@preconstruct/cli/worker");
  }
}
function destroyWorker() {
  if (worker !== undefined && shouldUseWorker) {
    worker.end();
    worker = undefined;
  }
}
function getWorker() {
  if (worker === undefined) {
    throw new Error("worker not defined");
  }

  return worker;
}

const lru = new QuickLRU({
  maxSize: 1000
});
let extensionRegex = /\.[tj]sx?$/;
let externalHelpersCache = new Map();

const resolvedBabelCore = require.resolve("@babel/core");

const babelHelpers = require(resolveFrom(resolvedBabelCore, "@babel/helpers"));

const babelGenerator = require(resolveFrom(resolvedBabelCore, "@babel/generator"));

const babelHelpersModuleStart = "\0rollupPluginBabelHelpers/"; // from https://github.com/babel/babel/blob/9808d2566e6a2b2d9e4c7890d8efbc9af180c683/packages/babel-core/src/transformation/file/file.js#L129-L164
// the main difference being that it uses a newer version of semver
// because the version of semver that @babel/core uses fails on semver.intersects calls with "*"

function babelRuntimeVersionRangeHasHelper(name, versionRange) {
  // babel's version has a try catch around this to handle unknown helpers
  // but if we're in here, we know that this version of @babel/helpers
  // understands the helper that we're getting the minVersion of
  let minVersion = babelHelpers.minVersion(name);
  return !semver.intersects(`<${minVersion}`, versionRange) && !semver.intersects(`>=8.0.0`, versionRange);
}

let rollupPluginBabel = ({
  cwd,
  reportTransformedFile,
  babelRuntime
}) => {
  // semver.intersects() has some surprising behavior with comparing ranges
  // with pre-release versions. We add '^' to ensure that we are always
  // comparing ranges with ranges, which sidesteps this logic.
  // For example:
  //
  //   semver.intersects(`<7.0.1`, "7.0.0-beta.0") // false - surprising
  //   semver.intersects(`<7.0.1`, "^7.0.0-beta.0") // true - expected
  //
  // This is because the first falls back to
  //
  //   semver.satisfies("7.0.0-beta.0", `<7.0.1`) // false - surprising
  //
  // and this fails because a prerelease version can only satisfy a range
  // if it is a prerelease within the same major/minor/patch range.
  //
  // Note: If this is found to have issues, please also revisit the logic in
  // transform-runtime's definitions.js file.
  const babelRuntimeVersion = semver.valid(babelRuntime === null || babelRuntime === void 0 ? void 0 : babelRuntime.range) ? `^${babelRuntime === null || babelRuntime === void 0 ? void 0 : babelRuntime.range}` : babelRuntime === null || babelRuntime === void 0 ? void 0 : babelRuntime.range;
  const resolveIdForBabelHelper = babelRuntimeVersion === undefined || babelRuntime === undefined || !semver.validRange(babelRuntimeVersion) ? helper => `${babelHelpersModuleStart}${helper}` : helper => {
    if (babelRuntimeVersionRangeHasHelper(helper, babelRuntimeVersion)) {
      return `${babelRuntime.name}/helpers/${helper}`;
    }

    return `${babelHelpersModuleStart}${helper}`;
  };
  return {
    name: "babel",

    resolveId(id, parent) {
      const currentIsBabelHelper = id.startsWith(babelHelpersModuleStart);

      if (!currentIsBabelHelper) {
        if (parent && parent.startsWith(babelHelpersModuleStart)) {
          return resolveIdForBabelHelper(id);
        }

        return null;
      }

      return resolveIdForBabelHelper(id.slice(babelHelpersModuleStart.length));
    },

    load(id) {
      let helperName = id.replace(/\0rollupPluginBabelHelpers\//, "");

      if (helperName === id) {
        return null;
      }

      let helpersSourceDescription = externalHelpersCache.get(helperName);

      if (helpersSourceDescription === undefined) {
        const helperNodes = babelHelpers.get(helperName).nodes;
        let helpers = babelGenerator.default( // @ts-ignore
        {
          type: "Program",
          body: helperNodes
        }).code;
        helpersSourceDescription = {
          ast: this.parse(helpers, undefined),
          code: helpers
        };
        externalHelpersCache.set(helperName, helpersSourceDescription);
      }

      return helpersSourceDescription;
    },

    transform(code, filename) {
      if (typeof filename !== "string" || filename[0] === "\0" || !extensionRegex.test(filename) || filename.includes("node_modules")) {
        return null;
      }

      if (lru.has(filename)) {
        let cachedResult = lru.get(filename);

        if (code === cachedResult.code) {
          return cachedResult.promise.then(result => {
            const ast = JSON.parse(JSON.stringify(result.ast));
            return {
              code: result.code,
              map: result.map,
              ast,
              meta: {
                babel: {
                  ast,
                  codeAtBabelTime: result.code
                }
              }
            };
          });
        }
      }

      let promise = getWorker().transformBabel(code, cwd, filename).then(x => {
        reportTransformedFile(filename);
        const ast = this.parse(x.code, undefined);
        return {
          code: x.code,
          ast: JSON.parse(JSON.stringify(ast)),
          map: x.map,
          meta: {
            babel: {
              ast,
              codeAtBabelTime: x.code
            }
          }
        };
      });
      lru.set(filename, {
        code,
        promise
      });
      return promise;
    }

  };
};

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty$6(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty$6(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function terser(options) {
  return {
    name: "terser",

    renderChunk(code, chunk, outputOptions) {
      const normalizedOptions = _objectSpread$2({}, options, {
        module: outputOptions.format === "es"
      });

      const result = getWorker().transformTerser(code, JSON.stringify(normalizedOptions)).catch(error => {
        const {
          message,
          line,
          col: column
        } = error;
        console.error(codeFrame.codeFrameColumns(code, {
          start: {
            line,
            column
          }
        }, {
          message
        }));
        throw error;
      });
      return result;
    }

  };
}

function inlineProcessEnvNodeEnv({
  sourceMap
}) {
  return {
    name: "inline-process-env-node-env-production",

    transform(code, id) {
      if (code.includes("process.env" + ".NODE_ENV")) {
        let magicString = new MagicString(code);

        const ast = (() => {
          const babelMeta = this.getModuleInfo(id).meta.babel;

          if ((babelMeta === null || babelMeta === void 0 ? void 0 : babelMeta.codeAtBabelTime) === code) {
            return this.getModuleInfo(id).meta.babel.ast;
          }

          return this.parse(code);
        })();

        estreeWalker.walk(ast, {
          enter(n, p) {
            const parent = p;
            const node = n;

            if (node.type === "MemberExpression" && !node.computed && node.object.type === "MemberExpression" && !node.object.computed && node.object.object.type === "Identifier" && node.object.object.name === "process" && node.object.property.type === "Identifier" && node.object.property.name === "env" && node.property.type === "Identifier" && node.property.name === "NODE_ENV" && isReference(node, parent) && parent.type !== "AssignmentExpression") {
              const start = node.start;
              const end = node.end;
              const len = end - start;
              this.replace({
                type: "Literal",
                // @ts-ignore
                start,
                end,
                value: "production",
                raw: '"production"'
              });
              magicString.overwrite(start, end, '"production"'.padStart(len));
            }
          }

        });
        let output = {
          code: magicString.toString(),
          ast
        };

        if (sourceMap) {
          output.map = magicString.generateMap({
            hires: true
          });
        }

        return output;
      }

      return null;
    }

  };
}

const makeExternalPredicate = externalArr => {
  if (externalArr.length === 0) {
    return () => false;
  }

  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return id => pattern.test(id);
};

let getRollupConfig = (pkg, entrypoints, aliases, type, reportTransformedFile) => {
  let external = [];

  if (pkg.json.peerDependencies) {
    external.push(...Object.keys(pkg.json.peerDependencies));
  }

  if (pkg.json.dependencies && type !== "umd") {
    external.push(...Object.keys(pkg.json.dependencies));
  }

  if (type === "node-dev" || type === "node-prod") {
    external.push(...builtInModules);
  }

  let input = {};
  entrypoints.forEach(entrypoint => {
    input[path__default.relative(pkg.directory, path__default.join(entrypoint.directory, "dist", getNameForDistForEntrypoint(entrypoint)))] = entrypoint.source;
  });
  let warnings = [];
  const config = {
    input,
    external: makeExternalPredicate(external),
    onwarn: warning => {
      if (typeof warning === "string") {
        warnings.push(new FatalError(`An unhandled Rollup error occurred: ${chalk.red( // @ts-ignore
        warning.toString())}`, pkg.name));
        return;
      }

      switch (warning.code) {
        case "CIRCULAR_DEPENDENCY":
        case "EMPTY_BUNDLE":
        case "EVAL":
        case "UNUSED_EXTERNAL_IMPORT":
          {
            break;
          }

        case "UNRESOLVED_IMPORT":
          {
            if (!warning.source.startsWith(".")) {
              warnings.push(new FatalError(`"${warning.source}" is imported by "${normalizePath(path__default.relative(pkg.directory, warning.importer))}" but the package is not specified in dependencies or peerDependencies`, pkg.name));
              return;
            }
          }

        case "THIS_IS_UNDEFINED":
          {
            if (type === "umd") {
              return;
            }

            warnings.push(new FatalError(`"${normalizePath(path__default.relative(pkg.directory, warning.loc.file))}" used \`this\` keyword at the top level of an ES module. You can read more about this at ${warning.url} and fix this issue that has happened here:\n\n${warning.frame}\n`, pkg.name));
            return;
          }

        default:
          {
            warnings.push(new FatalError(`An unhandled Rollup error occurred: ${chalk.red(warning.toString())}`, pkg.name));
          }
      }
    },
    plugins: [{
      name: "throw-warnings",

      buildEnd() {
        if (warnings.length) {
          throw new BatchError(warnings);
        }
      }

    }, type === "node-prod" && flowAndNodeDevProdEntry(pkg, warnings), type === "node-prod" && typescriptDeclarations(pkg), rollupPluginBabel({
      cwd: pkg.project.directory,
      reportTransformedFile,
      babelRuntime: (() => {
        for (const dep of ["@babel/runtime", "@babel/runtime-corejs2", "@babel/runtime-corejs3"]) {
          var _pkg$json$dependencie;

          const range = (_pkg$json$dependencie = pkg.json.dependencies) === null || _pkg$json$dependencie === void 0 ? void 0 : _pkg$json$dependencie[dep];

          if (range !== undefined) {
            return {
              range,
              name: dep
            };
          }
        }
      })()
    }), type === "umd" && cjs({
      include: ["**/node_modules/**", "node_modules/**"]
    }), rewriteBabelRuntimeHelpers(), json({
      namedExports: false
    }), type === "umd" && alias({
      entries: aliases
    }), resolve({
      extensions: EXTENSIONS,
      browser: type === "umd",
      customResolveOptions: {
        moduleDirectory: type === "umd" ? "node_modules" : []
      }
    }), type === "umd" && inlineProcessEnvNodeEnv({
      sourceMap: true
    }), type === "umd" && terser({
      sourceMap: true,
      compress: true
    }), type === "node-prod" && inlineProcessEnvNodeEnv({
      sourceMap: false
    }), (type === "browser" || type === "umd") && replace({
      values: {
        ["typeof " + "document"]: JSON.stringify("object"),
        ["typeof " + "window"]: JSON.stringify("object")
      },
      preventAssignment: true
    })].filter(x => !!x)
  };
  return config;
};

function getGlobal(project, name) {
  if (project.json.preconstruct.globals !== undefined && project.json.preconstruct.globals[name]) {
    return project.json.preconstruct.globals[name];
  } else {
    try {
      let pkgJson = require(resolveFrom(project.directory, path__default.join(name, "package.json")));

      if (pkgJson && pkgJson[PKG_JSON_CONFIG_FIELD] && pkgJson[PKG_JSON_CONFIG_FIELD].umdName) {
        return pkgJson[PKG_JSON_CONFIG_FIELD].umdName;
      }
    } catch (err) {
      if (err.code !== "MODULE_NOT_FOUND" && err.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
        throw err;
      }
    }

    throw limit(() => (async () => {
      // if while we were waiting, that global was added, return
      if (project.json.preconstruct.globals !== undefined && project.json.preconstruct.globals[name]) {
        return;
      }

      let response = await doPromptInput(`What should the umdName of ${name} be?`, project);

      if (!project.json.preconstruct.globals) {
        project.json.preconstruct.globals = {};
      }

      project.json.preconstruct.globals[name] = response;
      await project.save();
    })());
  }
}

const babelHelperId = /@babel\/runtime(|-corejs[23])\/helpers\//;

const interop = id => id && babelHelperId.test(id) ? "default" : "auto";

function getRollupConfigs(pkg, aliases) {
  const cjsPlugins = pkg.project.experimentalFlags.keepDynamicImportAsDynamicImportInCommonJS ? [{
    name: "cjs render dynamic import",

    renderDynamicImport() {
      return {
        left: "import(",
        right: ")"
      };
    }

  }] : [];
  let configs = [];
  let hasModuleField = pkg.entrypoints[0].json.module !== undefined;
  configs.push({
    config: getRollupConfig(pkg, pkg.entrypoints, aliases, "node-dev", pkg.project.experimentalFlags.logCompiledFiles ? filename => {
      info("compiled " + filename.replace(pkg.project.directory + path__default.sep, ""));
    } : () => {}),
    outputs: [{
      format: "cjs",
      entryFileNames: "[name].cjs.dev.js",
      chunkFileNames: "dist/[name]-[hash].cjs.dev.js",
      dir: pkg.directory,
      exports: "named",
      interop,
      plugins: cjsPlugins
    }, ...(hasModuleField ? [{
      format: "es",
      entryFileNames: "[name].esm.js",
      chunkFileNames: "dist/[name]-[hash].esm.js",
      dir: pkg.directory
    }] : [])]
  });
  configs.push({
    config: getRollupConfig(pkg, pkg.entrypoints, aliases, "node-prod", () => {}),
    outputs: [{
      format: "cjs",
      entryFileNames: "[name].cjs.prod.js",
      chunkFileNames: "dist/[name]-[hash].cjs.prod.js",
      dir: pkg.directory,
      exports: "named",
      interop,
      plugins: cjsPlugins
    }]
  }); // umd builds are a bit special
  // we don't guarantee that shared modules are shared across umd builds
  // this is just like dependencies, they're bundled into the umd build

  if (pkg.entrypoints[0].json["umd:main"] !== undefined) pkg.entrypoints.forEach(entrypoint => {
    configs.push({
      config: getRollupConfig(pkg, [entrypoint], aliases, "umd", () => {}),
      outputs: [{
        format: "umd",
        sourcemap: true,
        entryFileNames: "[name].umd.min.js",
        name: entrypoint.json.preconstruct.umdName,
        dir: pkg.directory,
        interop,
        globals: name => {
          if (name === entrypoint.json.preconstruct.umdName) {
            return name;
          }

          return getGlobal(pkg.project, name);
        }
      }]
    });
  });
  let hasBrowserField = pkg.entrypoints[0].json.browser !== undefined;

  if (hasBrowserField) {
    configs.push({
      config: getRollupConfig(pkg, pkg.entrypoints, aliases, "browser", () => {}),
      outputs: [{
        format: "cjs",
        entryFileNames: "[name].browser.cjs.js",
        chunkFileNames: "dist/[name]-[hash].browser.cjs.js",
        dir: pkg.directory,
        exports: "named",
        interop,
        plugins: cjsPlugins
      }, ...(hasModuleField ? [{
        format: "es",
        entryFileNames: "[name].browser.esm.js",
        chunkFileNames: "dist/[name]-[hash].browser.esm.js",
        dir: pkg.directory
      }] : [])]
    });
  }

  return configs;
}

// this looks ridiculous, but it prevents sourcemap tooling from mistaking
// this for an actual sourceMappingURL

let SOURCEMAPPING_URL = "sourceMa";
SOURCEMAPPING_URL += "ppingURL"; // https://github.com/rollup/rollup/blob/28ffcf4c4a2ab4323091f63944b2a609b7bcd701/src/rollup/rollup.ts#L333-L356

function writeOutputFile(outputFile, outputOptions) {
  const fileName = path__default.resolve(outputOptions.dir || path__default.dirname(outputOptions.file), outputFile.fileName);
  let writeSourceMapPromise;
  let source;

  if (outputFile.type === "asset") {
    source = outputFile.source;
  } else {
    source = outputFile.code;

    if (outputOptions.sourcemap && outputFile.map) {
      let url;

      if (outputOptions.sourcemap === "inline") {
        url = outputFile.map.toUrl();
      } else {
        url = `${path__default.basename(outputFile.fileName)}.map`;
        writeSourceMapPromise = fs.outputFile(`${fileName}.map`, outputFile.map.toString());
      }

      if (outputOptions.sourcemap !== "hidden") {
        source += `//# ${SOURCEMAPPING_URL}=${url}\n`;
      }
    }
  }

  return Promise.all([fs.outputFile(fileName, source), writeSourceMapPromise]);
}

async function buildPackage(pkg, aliases) {
  let configs = getRollupConfigs(pkg, aliases);
  let outputs = await Promise.all(configs.map(async ({
    config,
    outputs
  }) => {
    let bundle = await rollup.rollup(config);
    return Promise.all(outputs.map(async outputConfig => {
      return {
        output: (await bundle.generate(outputConfig)).output,
        outputConfig
      };
    }));
  }));
  await Promise.all(outputs.map(x => {
    return Promise.all(x.map(bundle => {
      return Promise.all(bundle.output.map(output => {
        return writeOutputFile(output, bundle.outputConfig);
      }));
    }));
  }));
}

async function retryableBuild(pkg, aliases) {
  try {
    await buildPackage(pkg, aliases);
  } catch (err) {
    if (err instanceof Promise) {
      await err;
      await retryableBuild(pkg, aliases);
      return;
    }

    if (err instanceof FatalError || err instanceof BatchError || err instanceof ScopelessError) {
      throw err;
    }

    if (err.pluginCode === "BABEL_PARSE_ERROR") {
      throw new ScopelessError(err.message);
    }

    throw new UnexpectedBuildError(err, pkg.name);
  }
}

async function build(directory) {
  // do more stuff with checking whether the repo is using yarn workspaces or bolt
  try {
    createWorker();
    let project = await Project.create(directory);
    validateProject(project);
    info("building bundles!");
    await cleanProjectBeforeBuild(project);
    let aliases = getAliases(project);
    let errors = [];
    await Promise.all(project.packages.map(async pkg => {
      try {
        await retryableBuild(pkg, aliases);
      } catch (err) {
        if (err instanceof BatchError) {
          errors.push(...err.errors);
        } else {
          errors.push(err);
        }
      }
    }));

    if (errors.length) {
      throw new BatchError(errors.sort((a, b) => (a.scope + a.message).localeCompare(b.scope + b.message)));
    }

    success("built bundles!");
  } finally {
    destroyWorker();
  }
}

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(Object(source), true).forEach(function (key) { _defineProperty$7(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty$7(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function relativePath(id) {
  return path__default.relative(process.cwd(), id);
}

async function watchPackage(pkg, aliases) {
  const _configs = getRollupConfigs(pkg, aliases);

  let configs = _configs.map(config => {
    return _objectSpread$3({}, config.config, {
      output: config.outputs
    });
  });

  const watcher = rollup.watch(configs);
  let reject;
  let errPromise = new Promise((resolve, _reject) => {
    reject = _reject;
  });
  let startResolve;
  let startPromise = new Promise(resolve => {
    startResolve = resolve;
  });
  watcher.on("event", event => {
    // https://github.com/rollup/rollup/blob/aed954e4e6e8beabd47268916ff0955fbb20682d/bin/src/run/watch.ts#L71-L115
    switch (event.code) {
      case "ERROR":
        {
          reject(event.error);
          break;
        }

      case "START":
        startResolve();
        break;

      case "BUNDLE_START":
        {
          info(chalk.cyan(`bundles ${chalk.bold(typeof event.input === "string" ? relativePath(event.input) : Array.isArray(event.input) ? event.input.map(relativePath).join(", ") : Object.values(event.input) // @ts-ignore
          .map(relativePath).join(", "))} → ${chalk.bold(event.output.map(relativePath).join(", "))}...`), pkg.name);
          break;
        }

      case "BUNDLE_END":
        {
          info(chalk.green(`created ${chalk.bold(event.output.map(relativePath).join(", "))} in ${chalk.bold(ms(event.duration))}`), pkg.name);
          break;
        }

      case "END":
        {
          info("waiting for changes...", pkg.name);
        }
    }
  });
  return {
    error: errPromise,
    start: startPromise
  };
}

async function retryableWatch(pkg, aliases, getPromises, depth) {
  try {
    let {
      error,
      start
    } = await watchPackage(pkg, aliases);

    if (depth === 0) {
      getPromises({
        start
      });
    }

    await error;
  } catch (err) {
    if (err instanceof Promise) {
      await err;
      await retryableWatch(pkg, aliases, getPromises, depth + 1);
      return;
    }

    throw err;
  }
}

async function build$1(directory) {
  createWorker();
  let project = await Project.create(directory);
  validateProject(project);
  await cleanProjectBeforeBuild(project);
  let aliases = getAliases(project);
  let startCount = 0;
  await Promise.all(project.packages.map(pkg => retryableWatch(pkg, aliases, async ({
    start
  }) => {
    await start;
    startCount++;

    if (startCount === project.packages.length) {
      success(successes.startedWatching);
    }
  }, 0)));
}

async function fixEntrypoint(entrypoint) {
  if (entrypoint.json["umd:main"] !== undefined && !isUmdNameSpecified(entrypoint)) {
    let umdName = await promptInput(inputs.getUmdName, entrypoint);
    entrypoint.json.preconstruct.umdName = umdName;
    await entrypoint.save();
    return true;
  }

  return false;
}

async function fix(directory) {
  let project = await Project.create(directory, true);
  let didModifyProject = false;

  if (project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH) {
    let errors = [];
    Object.keys(project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH).forEach(key => {
      if (FORMER_FLAGS_THAT_ARE_ENABLED_NOW.has(key)) {
        didModifyProject = true;
        delete project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH[key];
      } else if (!EXPERIMENTAL_FLAGS.has(key)) {
        errors.push(new FatalError(`The experimental flag ${JSON.stringify(key)} in your config does not exist`, project.name));
      }
    });

    if (didModifyProject) {
      if (Object.keys(project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH).length === 0) {
        delete project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH;
      }

      await project.save();
    }

    if (errors.length) {
      throw new BatchError(errors);
    }
  }

  let didModifyPackages = (await Promise.all(project.packages.map(async pkg => {
    let didModifyInPkgFix = await fixPackage(pkg);
    let didModifyInEntrypointsFix = (await Promise.all(pkg.entrypoints.map(fixEntrypoint))).some(x => x);
    return didModifyInPkgFix || didModifyInEntrypointsFix;
  }))).some(x => x);
  success(didModifyProject || didModifyPackages ? "fixed project!" : "project already valid!");
}

// @ts-ignore

process["e" + "nv"].NODE_ENV = "production";
let {
  input
} = meow(`
Usage
  $ preconstruct [command]
Commands
  init         initialise a project
  build        build the project
  watch        start a watch process to build the project
  validate     validate the project
  fix          infer as much information as possible and fix the project
  dev          create links so entrypoints can be imported

`, {});
let errors$1 = {
  commandNotFound: "Command not found"
};

class CommandNotFoundError extends Error {}

(async () => {
  if (input.length === 1) {
    switch (input[0]) {
      case "init":
        {
          await init(process.cwd());
          return;
        }

      case "validate":
        {
          await validate(process.cwd());
          return;
        }

      case "build":
        {
          await build(process.cwd());
          return;
        }

      case "watch":
        {
          await build$1(process.cwd());
          return;
        }

      case "fix":
        {
          await fix(process.cwd());
          return;
        }

      case "dev":
        {
          await dev(process.cwd());
          return;
        }

      default:
        {
          throw new CommandNotFoundError();
        }
    }
  } else {
    throw new CommandNotFoundError();
  }
})().catch(err => {
  let hasFixableError = false;

  if (err instanceof FixableError) {
    hasFixableError = true;
    error(err.message, err.scope);
  } else if (err instanceof FatalError) {
    error(err.message, err.scope);
  } else if (err instanceof BatchError) {
    for (let fatalError of err.errors) {
      if (fatalError instanceof FixableError) {
        hasFixableError = true;
        error(fatalError.message, fatalError.scope);
      } else {
        error(fatalError.message, fatalError.scope);
      }
    }
  } else if (err instanceof CommandNotFoundError) {
    error(errors$1.commandNotFound);
  } else if (err instanceof UnexpectedBuildError) {
    error(err.message, err.scope);
  } else if (err instanceof ScopelessError) {
    log(err.message);
  } else {
    error(err);
  }

  if (hasFixableError) {
    info("Some of the errors above can be fixed automatically by running preconstruct fix");
  }

  info("If want to learn more about the above error, check https://preconstruct.tools/errors");
  info("If the error is not there and you want to learn more about it, open an issue at https://github.com/preconstruct/preconstruct/issues/new");
  process.exit(1);
});
