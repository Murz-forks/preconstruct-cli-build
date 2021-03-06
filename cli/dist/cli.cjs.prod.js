"use strict";

function _interopDefault(ex) {
  return ex && "object" == typeof ex && "default" in ex ? ex.default : ex;
}

var meow = _interopDefault(require("meow")), path = require("path"), path__default = _interopDefault(path), enquirer = _interopDefault(require("enquirer")), pLimit = _interopDefault(require("p-limit")), DataLoader = _interopDefault(require("dataloader")), chalk = _interopDefault(require("chalk")), fastGlob = _interopDefault(require("fast-glob")), fs = require("fs-extra"), detectIndent = _interopDefault(require("detect-indent")), parseJson = _interopDefault(require("parse-json")), util = _interopDefault(require("util")), normalizePath = _interopDefault(require("normalize-path")), parseGlob = _interopDefault(require("parse-glob")), packlist = _interopDefault(require("npm-packlist")), equal = _interopDefault(require("fast-deep-equal")), resolveFrom = _interopDefault(require("resolve-from")), rollup = require("rollup"), resolve = _interopDefault(require("@rollup/plugin-node-resolve")), alias = _interopDefault(require("@rollup/plugin-alias")), cjs = _interopDefault(require("@rollup/plugin-commonjs")), replace = _interopDefault(require("@rollup/plugin-replace")), builtInModules = _interopDefault(require("builtin-modules")), os = require("os"), babel = require("@babel/core"), json = _interopDefault(require("@rollup/plugin-json")), Worker = _interopDefault(require("jest-worker")), isCI = _interopDefault(require("is-ci")), QuickLRU = _interopDefault(require("quick-lru")), semver = _interopDefault(require("semver")), codeFrame = require("@babel/code-frame"), estreeWalker = require("estree-walker"), isReference = _interopDefault(require("is-reference")), MagicString = _interopDefault(require("magic-string")), ms = _interopDefault(require("ms"));

let limit = pLimit(1), prefix = `🎁 ${chalk.green("?")}`;

function createPromptConfirmLoader(message) {
  let loader = new DataLoader(pkgs => limit(() => (async () => {
    if (1 === pkgs.length) {
      let {confirm: confirm} = await enquirer.prompt([ {
        type: "confirm",
        name: "confirm",
        message: message,
        prefix: prefix + " " + pkgs[0].name,
        initial: !0
      } ]);
      return [ confirm ];
    }
    let {answers: answers} = await enquirer.prompt([ {
      type: "multiselect",
      name: "answers",
      message: message,
      choices: pkgs.map(pkg => ({
        name: pkg.name,
        initial: !0
      })),
      prefix: prefix
    } ]);
    return pkgs.map(pkg => answers.includes(pkg.name));
  })()));
  return pkg => loader.load(pkg);
}

let doPromptInput = async (message, pkg, defaultAnswer) => {
  let {input: input} = await enquirer.prompt([ {
    type: "input",
    name: "input",
    message: message,
    prefix: prefix + " " + pkg.name,
    initial: defaultAnswer
  } ]);
  return input;
}, promptInput = (message, pkg, defaultAnswer) => limit(() => doPromptInput(message, pkg, defaultAnswer));

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter((function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    }))), keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach((function(key) {
      _defineProperty(target, key, source[key]);
    })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach((function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    }));
  }
  return target;
}

function _defineProperty(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

class Item {
  constructor(filePath, contents, jsonDataByPath) {
    if (_defineProperty(this, "path", void 0), _defineProperty(this, "indent", void 0), 
    _defineProperty(this, "directory", void 0), _defineProperty(this, "_jsonDataByPath", void 0), 
    this.indent = detectIndent(contents).indent || "  ", this.path = filePath, this.directory = path__default.dirname(filePath), 
    this._jsonDataByPath = jsonDataByPath, !jsonDataByPath.has(this.path)) {
      const json = parseJson(contents, filePath);
      jsonDataByPath.set(this.path, {
        value: json,
        stringifiedSaved: JSON.stringify(json)
      }), this.json.preconstruct || (this.json.preconstruct = {});
    }
  }
  get json() {
    return this._jsonDataByPath.get(this.path).value;
  }
  set json(value) {
    this._jsonDataByPath.set(this.path, {
      value: value,
      stringifiedSaved: this._jsonDataByPath.get(this.path).stringifiedSaved
    });
  }
  async save() {
    const json = _objectSpread({}, this.json);
    return json.preconstruct && null !== json.preconstruct && "object" == typeof json.preconstruct && !Object.keys(json.preconstruct).length && delete json.preconstruct, 
    JSON.stringify(json) !== this._jsonDataByPath.get(this.path).stringifiedSaved && (await fs.writeFile(this.path, JSON.stringify(json, null, this.indent) + "\n"), 
    !0);
  }
}

function format(message, messageType, scope) {
  let fullPrefix = "🎁" + {
    error: " " + chalk.red("error"),
    success: " " + chalk.green("success"),
    info: " " + chalk.cyan("info"),
    none: ""
  }[messageType] + (scope ? " " + chalk.cyan(scope) : "");
  return String(message).split("\n").map(line => line.trim() ? `${fullPrefix} ${line}` : fullPrefix).join("\n");
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

function _defineProperty$1(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

class FatalError extends Error {
  constructor(message, scope) {
    super(message), _defineProperty$1(this, "scope", void 0), this.scope = scope;
  }
}

class BatchError extends Error {
  constructor(errors) {
    super(errors.map(x => format(x.message, "none", x.scope)).join("\n")), _defineProperty$1(this, "errors", void 0), 
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

function _defineProperty$2(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

class Entrypoint extends Item {
  constructor(filePath, contents, pkg, source) {
    super(filePath, contents, pkg._jsonDataByPath), _defineProperty$2(this, "package", void 0), 
    _defineProperty$2(this, "source", void 0), this.package = pkg, this.source = source;
  }
  get name() {
    return normalizePath(path__default.join(this.package.name, path__default.relative(this.package.directory, this.directory)));
  }
}

const EXTENSIONS = [ ".js", ".jsx", ".ts", ".tsx" ], PKG_JSON_CONFIG_FIELD = "preconstruct";

let errors = {
  noSource: source => `no source file was provided, please create a file at ${source} or specify a custom source file with the ${PKG_JSON_CONFIG_FIELD} source option`,
  deniedWriteMainField: "changing the main field is required to build",
  invalidField: (field, found, expected) => `${field} field ${void 0 === found ? chalk.red("was not found") : `is invalid, found \`${chalk.red(JSON.stringify(found))}\``}, expected \`${chalk.green(JSON.stringify(expected))}\``,
  umdNameNotSpecified: `the umd:main field is specified but a umdName option is not specified. please add it to the ${PKG_JSON_CONFIG_FIELD} field in your package.json`,
  noEntrypointPkgJson: "There is a missing package.json for an entrypoint",
  noEntrypoints: "packages must have at least one entrypoint, this package has no entrypoints",
  fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit: field => `all entrypoints in a package must have the same fields and one entrypoint in this package has a ${field} field but you've declined the fix`
}, confirms = {
  writeMainField: createPromptConfirmLoader("preconstruct is going to change the main field in your package.json, are you okay with that?"),
  writeModuleField: createPromptConfirmLoader("would you like to generate module builds? this will write to the module field in your package.json"),
  fixModuleField: createPromptConfirmLoader("would you like to fix the module field?"),
  fixUmdBuild: createPromptConfirmLoader("would you like to fix the umd field?"),
  fixBrowserField: createPromptConfirmLoader("would you like to fix the browser build?"),
  createEntrypointPkgJson: createPromptConfirmLoader("A package.json file does not exist for this entrypoint, would you like to create one automatically?"),
  createEntrypoint: createPromptConfirmLoader("This glob does not match anything, would you like to create an entrypoint for it?")
}, inputs = {
  getUmdName: "what should the name used for UMD bundles be?",
  getSource: "what should the source file for this entrypoint be?"
}, infos = {
  validField: field => `${field} field is valid`,
  validEntrypoint: "a valid entry point exists.",
  validPackageEntrypoints: "package entrypoints are valid"
}, successes = {
  validProject: "project is valid!",
  startedWatching: "started watching!"
};

async function getUselessGlobsThatArentReallyGlobsForNewEntrypoints(globs, files, cwd) {
  let filesSet = new Set(files.map(x => normalizePath(x)));
  return (await Promise.all(globs.map(async glob => {
    if (!parseGlob(glob).is.glob) {
      let filename = normalizePath(path__default.resolve(cwd, "src", glob));
      if (filesSet.has(filename)) return;
      try {
        await fs.stat(filename);
      } catch (err) {
        if ("ENOENT" === err.code) return {
          filename: filename,
          glob: glob,
          exists: !1
        };
        throw err;
      }
      return {
        filename: filename,
        glob: glob,
        exists: !0
      };
    }
  }))).filter(x => !!x);
}

function ownKeys$1(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter((function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    }))), keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread$1(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys$1(Object(source), !0).forEach((function(key) {
      _defineProperty$3(target, key, source[key]);
    })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach((function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    }));
  }
  return target;
}

function _defineProperty$3(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

function getNameForDistForEntrypoint(entrypoint) {
  return getDistName(entrypoint.package, entrypoint.name);
}

let fields = [ "version", "description", "main", "module", "umd:main", "browser" ];

function setFieldInOrder(obj, field, value) {
  if (field in obj) {
    let newObj = _objectSpread$1({}, obj);
    return newObj[field] = value, newObj;
  }
  let fieldIndex = fields.indexOf(field), idealField = fields.slice(0, fieldIndex).reverse().find(key => key in obj);
  if (void 0 === idealField) return _objectSpread$1({}, obj, {
    [field]: value
  });
  let newObj = {};
  for (let key in obj) newObj[key] = obj[key], key === idealField && (newObj[field] = value);
  return newObj;
}

function getEntrypointName(pkg, entrypointDir) {
  return normalizePath(path.join(pkg.name, path.relative(pkg.directory, path.resolve(pkg.directory, entrypointDir))));
}

function getDistNameWithStrategy(pkg, entrypointName, strategy) {
  return "full" === strategy ? entrypointName.replace("@", "").replace(/\//g, "-") : pkg.name.replace(/.*\//, "");
}

function getDistName(pkg, entrypointName, forceStrategy) {
  if (forceStrategy) return getDistNameWithStrategy(pkg, entrypointName, forceStrategy);
  if ("distFilenameStrategy" in pkg.project.json.preconstruct) {
    if ("full" !== pkg.project.json.preconstruct.distFilenameStrategy && "unscoped-package-name" !== pkg.project.json.preconstruct.distFilenameStrategy) throw new FatalError(`distFilenameStrategy is defined in your Preconstruct config as ${JSON.stringify(pkg.project.json.preconstruct.distFilenameStrategy)} but the only accepted values are "full" and "unscoped-package-name"`, pkg.project.name);
    if ("unscoped-package-name" === pkg.project.json.preconstruct.distFilenameStrategy) return getDistNameWithStrategy(pkg, entrypointName, "unscoped-package-name");
  }
  return getDistNameWithStrategy(pkg, entrypointName, "full");
}

const validFieldsFromPkg = {
  main: (pkg, entrypointName, forceStrategy) => `dist/${getDistName(pkg, entrypointName, forceStrategy)}.cjs.js`,
  module: (pkg, entrypointName, forceStrategy) => `dist/${getDistName(pkg, entrypointName, forceStrategy)}.esm.js`,
  "umd:main": (pkg, entrypointName, forceStrategy) => `dist/${getDistName(pkg, entrypointName, forceStrategy)}.umd.min.js`,
  browser(pkg, hasModuleBuild, entrypointName, forceStrategy) {
    let safeName = getDistName(pkg, entrypointName, forceStrategy), obj = {
      [`./dist/${safeName}.cjs.js`]: `./dist/${safeName}.browser.cjs.js`
    };
    return hasModuleBuild && (obj[`./dist/${safeName}.esm.js`] = `./dist/${safeName}.browser.esm.js`), 
    obj;
  }
}, validFields = {
  main: (entrypoint, forceStrategy) => validFieldsFromPkg.main(entrypoint.package, entrypoint.name, forceStrategy),
  module: (entrypoint, forceStrategy) => validFieldsFromPkg.module(entrypoint.package, entrypoint.name, forceStrategy),
  "umd:main": (entrypoint, forceStrategy) => validFieldsFromPkg["umd:main"](entrypoint.package, entrypoint.name, forceStrategy),
  browser: (entrypoint, forceStrategy) => validFieldsFromPkg.browser(entrypoint.package, void 0 !== entrypoint.json.module, entrypoint.name, forceStrategy)
};

function flowTemplate(hasDefaultExport, relativePath) {
  const escapedPath = JSON.stringify(relativePath);
  return `// @flow\nexport * from ${escapedPath};${hasDefaultExport ? `\nexport { default } from ${escapedPath};` : ""}\n`;
}

function tsTemplate(hasDefaultExport, relativePath) {
  const escapedPath = JSON.stringify(relativePath);
  return `export * from ${escapedPath};${hasDefaultExport ? `\nexport { default } from ${escapedPath};` : ""}\n`;
}

function _defineProperty$4(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

function getFieldsUsedInEntrypoints(descriptors) {
  const fields = new Set([ "main" ]);
  for (let descriptor of descriptors) if (void 0 !== descriptor.contents) {
    let parsed = parseJson(descriptor.contents, descriptor.filename);
    for (let field of [ "module", "umd:main", "browser" ]) void 0 !== parsed[field] && fields.add(field);
  }
  return fields;
}

function getPlainEntrypointContent(pkg, fields, entrypointDir, indent) {
  const obj = {};
  for (const field of fields) obj[field] = "browser" === field ? validFieldsFromPkg[field](pkg, fields.has("module"), getEntrypointName(pkg, entrypointDir)) : validFieldsFromPkg[field](pkg, getEntrypointName(pkg, entrypointDir));
  return JSON.stringify(obj, null, indent) + "\n";
}

function createEntrypoints(pkg, descriptors) {
  let fields = getFieldsUsedInEntrypoints(descriptors);
  return Promise.all(descriptors.map(async ({filename: filename, contents: contents, hasAccepted: hasAccepted, sourceFile: sourceFile}) => {
    if (void 0 === contents) {
      if (!hasAccepted) {
        const entrypointName = getEntrypointName(pkg, path__default.dirname(filename));
        if (!await confirms.createEntrypointPkgJson({
          name: entrypointName
        })) throw new FatalError(errors.noEntrypointPkgJson, entrypointName);
      }
      contents = getPlainEntrypointContent(pkg, fields, path__default.dirname(filename), pkg.indent), 
      await fs.outputFile(filename, contents);
    }
    return new Entrypoint(filename, contents, pkg, sourceFile);
  }));
}

class Package extends Item {
  constructor(...args) {
    super(...args), _defineProperty$4(this, "project", void 0), _defineProperty$4(this, "entrypoints", void 0);
  }
  get configEntrypoints() {
    if (void 0 === this.json.preconstruct.entrypoints) return [ "index.{js,jsx,ts,tsx}" ];
    if (Array.isArray(this.json.preconstruct.entrypoints) && this.json.preconstruct.entrypoints.every(x => "string" == typeof x)) return this.json.preconstruct.entrypoints;
    throw new FatalError("The entrypoints option for this packages is not an array of globs", this.name);
  }
  static async create(directory, project, isFix) {
    let filePath = path__default.join(directory, "package.json"), contents = await fs.readFile(filePath, "utf-8"), pkg = new Package(filePath, contents, project._jsonDataByPath);
    pkg.project = project;
    let entrypoints = await fastGlob(pkg.configEntrypoints, {
      cwd: path__default.join(pkg.directory, "src"),
      onlyFiles: !0,
      absolute: !0
    });
    if (!entrypoints.length) {
      if ((await fastGlob(pkg.configEntrypoints, {
        cwd: pkg.directory,
        onlyDirectories: !0,
        absolute: !0
      })).length) throw new FatalError("this package has no entrypoints but it does have some using v1's entrypoints config, please see the the changelog for how to upgrade", pkg.name);
    }
    pkg.entrypoints = await Promise.all(entrypoints.map(async sourceFile => {
      if (!/\.[tj]sx?$/.test(sourceFile)) throw new FatalError(`entrypoint source files must end in .js, .jsx, .ts or .tsx but ${path__default.relative(pkg.directory, sourceFile)} does not`, pkg.name);
      if (!normalizePath(sourceFile).includes(normalizePath(path__default.join(pkg.directory, "src")))) throw new FatalError(`entrypoint source files must be inside of the src directory of a package but ${normalizePath(path__default.relative(pkg.directory, sourceFile))} is not`, pkg.name);
      let directory = path__default.join(pkg.directory, path__default.resolve(sourceFile).replace(path__default.join(pkg.directory, "src"), "").replace(/\.[tj]sx?$/, ""));
      "index" === path__default.basename(directory) && (directory = path__default.dirname(directory));
      let filename = path__default.join(directory, "package.json"), contents = void 0;
      try {
        contents = await fs.readFile(filename, "utf-8");
      } catch (e) {
        if ("ENOENT" !== e.code) throw e;
      }
      return {
        filename: filename,
        contents: contents,
        sourceFile: sourceFile,
        hasAccepted: isFix
      };
    })).then(async descriptors => {
      const globErrors = await getUselessGlobsThatArentReallyGlobsForNewEntrypoints(pkg.configEntrypoints, entrypoints, pkg.directory);
      if (globErrors.length) {
        let errors = globErrors.map(globError => globError.exists ? new FatalError(`specifies a entrypoint ${JSON.stringify(globError.glob)} but it is negated in the same config so it should be removed or the config should be fixed`, pkg.name) : new FatalError(`specifies a entrypoint ${JSON.stringify(globError.glob)} but the file does not exist, please create it or fix the config`, pkg.name));
        if (errors.length) throw new BatchError(errors);
      }
      return createEntrypoints(pkg, descriptors);
    });
    const entrypointsWithSourcePath = new Map;
    for (const entrypoint of pkg.entrypoints) {
      if (void 0 !== entrypoint.json.preconstruct.source) throw new FatalError("The source option on entrypoints no longer exists, see the changelog for how to upgrade to the new entrypoints config", this.name);
      if (entrypointsWithSourcePath.has(entrypoint.name)) throw new FatalError(`this package has multiple source files for the same entrypoint of ${entrypoint.name} at ${normalizePath(path__default.relative(pkg.directory, entrypointsWithSourcePath.get(entrypoint.name)))} and ${normalizePath(path__default.relative(pkg.directory, entrypoint.source))}`, pkg.name);
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
    if ("string" != typeof this.json.name) throw new FatalError("The name field on this package is not a string", this.directory);
    return this.json.name;
  }
}

async function validateIncludedFiles(pkg) {
  try {
    const rootDistDirectoryTestFilepath = path__default.join(pkg.directory, "dist", "preconstruct-test-file"), hasNoEntrypointAtRootOfPackage = pkg.entrypoints.every(entrypoint => entrypoint.directory !== pkg.directory);
    await Promise.all(pkg.entrypoints.map(async entrypoint => {
      let filename = path__default.join(entrypoint.directory, "dist", "preconstruct-test-file");
      return fs.outputFile(filename, "test content");
    }).concat(hasNoEntrypointAtRootOfPackage ? fs.outputFile(rootDistDirectoryTestFilepath, "test content") : []));
    let packedFilesArr = await packlist({
      path: pkg.directory
    }), result = new Set(packedFilesArr.map(p => path__default.normalize(p))), messages = [];
    if (pkg.entrypoints.forEach(entrypoint => {
      let pkgJsonPath = path__default.relative(pkg.directory, path__default.resolve(entrypoint.directory, "package.json")), distFilePath = path__default.relative(pkg.directory, path__default.resolve(entrypoint.directory, "dist", "preconstruct-test-file")), entrypointName = path__default.relative(pkg.directory, entrypoint.directory);
      result.has(pkgJsonPath) ? result.has(distFilePath) || messages.push(`the dist directory ${"" === entrypointName ? "" : `for entrypoint ${chalk.cyan(entrypointName)} `}isn't included in the published files for this package, please add it to the files field in the package's package.json`) : messages.push(`the entrypoint ${chalk.cyan(entrypointName)} isn't included in the published files for this package, please add it to the files field in the package's package.json`);
    }), hasNoEntrypointAtRootOfPackage && !result.has(path__default.relative(pkg.directory, rootDistDirectoryTestFilepath)) && messages.push("the dist directory in the root of the package isn't included in the published files for this package, please add it to the files field in the package's package.json.\nthough this package does not have an entrypoint at the root of the package, preconstruct will write common chunks to the root dist directory so it must be included."), 
    messages.length) throw new FatalError(messages.join("\n"), pkg.name);
  } finally {
    await Promise.all(pkg.entrypoints.map(entrypoint => fs.remove(path__default.join(entrypoint.directory, "dist", "preconstruct-test-file"))));
  }
}

function _defineProperty$5(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

const allSettled = promises => Promise.all(promises.map(promise => promise.then(value => ({
  status: "fulfilled",
  value: value
}), reason => ({
  status: "rejected",
  reason: reason
}))));

class Project extends Item {
  constructor(...args) {
    super(...args), _defineProperty$5(this, "packages", void 0);
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
    if (void 0 === this.json.preconstruct.packages) return [ "." ];
    if (Array.isArray(this.json.preconstruct.packages) && this.json.preconstruct.packages.every(x => "string" == typeof x)) return this.json.preconstruct.packages;
    throw new FatalError("The packages option for this project is not an array of globs", this.name);
  }
  static async create(_directory, isFix = !1) {
    const directory = await fs.realpath.native(_directory);
    let filePath = path__default.join(directory, "package.json"), contents = await fs.readFile(filePath, "utf-8"), project = new Project(filePath, contents, new Map);
    return project.packages = await project._packages(isFix), project;
  }
  get name() {
    if ("string" != typeof this.json.name) throw new FatalError("The name field on this project is not a string", this.directory);
    return this.json.name;
  }
  async _packages(isFix) {
    if (!this.json.preconstruct.packages && this.json.workspaces) {
      let workspaces;
      Array.isArray(this.json.workspaces) ? workspaces = this.json.workspaces : Array.isArray(this.json.workspaces.packages) && (workspaces = this.json.workspaces.packages);
      let packages = await promptInput("what packages should preconstruct build?", this, workspaces.join(","));
      this.json.preconstruct.packages = packages.split(","), await this.save();
    }
    let filenames = await fastGlob(this.configPackages, {
      cwd: this.directory,
      onlyDirectories: !0,
      absolute: !0
    }), packages = [];
    await Promise.all(filenames.map(async x => {
      try {
        packages.push(await Package.create(x, this, isFix));
      } catch (err) {
        if ("ENOENT" === err.code && err.path === path__default.join(x, "package.json")) return;
        throw err;
      }
    }));
    const errored = (await allSettled(packages.map(pkg => validateIncludedFiles(pkg)))).find(result => "rejected" === result.status);
    if (errored) throw errored.reason;
    return packages;
  }
}

let keys = Object.keys;

async function fixPackage(pkg) {
  if (0 === pkg.entrypoints.length) throw new FatalError(errors.noEntrypoints, pkg.name);
  let fields = {
    main: !0,
    module: pkg.entrypoints.some(x => void 0 !== x.json.module),
    "umd:main": pkg.entrypoints.some(x => void 0 !== x.json["umd:main"]),
    browser: pkg.entrypoints.some(x => void 0 !== x.json.browser)
  };
  return keys(fields).filter(x => fields[x]).forEach(field => {
    pkg.setFieldOnEntrypoints(field);
  }), (await Promise.all(pkg.entrypoints.map(x => x.save()))).some(x => x);
}

let unsafeRequire = require;

function validatePackage(pkg) {
  if (0 === pkg.entrypoints.length) throw new FatalError(errors.noEntrypoints, pkg.name);
  let fields = {
    module: void 0 !== pkg.entrypoints[0].json.module,
    "umd:main": void 0 !== pkg.entrypoints[0].json["umd:main"],
    browser: void 0 !== pkg.entrypoints[0].json.browser
  };
  if (pkg.entrypoints.forEach(entrypoint => {
    keys(fields).forEach(field => {
      if (entrypoint.json[field] && !fields[field]) throw new FixableError(`${entrypoint.name} has a ${field} build but ${pkg.entrypoints[0].name} does not have a ${field} build. Entrypoints in a package must either all have a particular build type or all not have a particular build type.`, pkg.name);
      if (!entrypoint.json[field] && fields[field]) throw new FixableError(`${pkg.entrypoints[0].name} has a ${field} build but ${entrypoint.name} does not have a ${field} build. Entrypoints in a package must either all have a particular build type or all not have a particular build type.`, pkg.name);
    });
  }), fields["umd:main"]) {
    let sortaAllDeps = new Set([ ...pkg.json.peerDependencies ? Object.keys(pkg.json.peerDependencies) : [], ...pkg.json.dependencies ? Object.keys(pkg.json.dependencies) : [] ]);
    for (let depName in pkg.json.dependencies) {
      let depPkgJson;
      try {
        depPkgJson = unsafeRequire(resolveFrom(pkg.directory, depName + "/package.json"));
      } catch (err) {
        if ("ERR_PACKAGE_PATH_NOT_EXPORTED" === err.code) continue;
        throw err;
      }
      if (depPkgJson.peerDependencies) for (let pkgName in depPkgJson.peerDependencies) if (!sortaAllDeps.has(pkgName)) throw new FatalError(`the package ${chalk.blue(pkg.name)} depends on ${chalk.blue(depName)} which has a peerDependency on ${chalk.blue(pkgName)} but ${chalk.blue(pkgName)} is not specified in the dependencies or peerDependencies of ${chalk.blue(pkg.name)}. please add ${chalk.blue(pkgName)} to the dependencies or peerDependencies of ${chalk.blue(pkg.name)}`, pkg.name);
    }
  }
}

const isFieldValid = {
  main: entrypoint => entrypoint.json.main === validFields.main(entrypoint),
  module: entrypoint => entrypoint.json.module === validFields.module(entrypoint),
  "umd:main": entrypoint => entrypoint.json["umd:main"] === validFields["umd:main"](entrypoint),
  browser: entrypoint => equal(entrypoint.json.browser, validFields.browser(entrypoint))
};

function isUmdNameSpecified(entrypoint) {
  return "string" == typeof entrypoint.json.preconstruct.umdName;
}

let projectsShownOldDistNamesInfo = new WeakSet;

function validateEntrypoint(entrypoint, log) {
  log && info(infos.validEntrypoint, entrypoint.name);
  const fatalErrors = [];
  for (const field of [ "main", "module", "umd:main", "browser" ]) if ("main" === field || void 0 !== entrypoint.json[field]) {
    if (!isFieldValid[field](entrypoint)) {
      let isUsingOldDistFilenames = validFields[field](entrypoint, "unscoped-package-name") === entrypoint.json[field];
      isUsingOldDistFilenames && !projectsShownOldDistNamesInfo.has(entrypoint.package.project) && (projectsShownOldDistNamesInfo.add(entrypoint.package.project), 
      info("it looks like you're using the dist filenames of Preconstruct v1, the default dist filename strategy has changed in v2"), 
      info(`you can run ${chalk.green("preconstruct fix")} to use the new dist filenames`), 
      info('if you want to keep the dist filename strategy of v1, add `"distFilenameStrategy": "unscoped-package-name"` to the Preconstruct config in your root package.json')), 
      fatalErrors.push(new (isUsingOldDistFilenames ? FatalError : FixableError)(errors.invalidField(field, entrypoint.json[field], validFields[field](entrypoint)), entrypoint.name));
    }
    "umd:main" !== field || isUmdNameSpecified(entrypoint) || fatalErrors.push(new FixableError(errors.umdNameNotSpecified, entrypoint.name)), 
    log && !fatalErrors.length && info(infos.validField(field), entrypoint.name);
  }
  if (fatalErrors.length) throw new BatchError(fatalErrors);
}

const FORMER_FLAGS_THAT_ARE_ENABLED_NOW = new Set([ "newEntrypoints", "newDistFilenames", "newProcessEnvNodeEnvReplacementStrategyAndSkipTerserOnCJSProdBuild" ]), EXPERIMENTAL_FLAGS = new Set([ "logCompiledFiles", "typeScriptProxyFileWithImportEqualsRequireAndExportEquals", "keepDynamicImportAsDynamicImportInCommonJS" ]);

function validateProject(project, log = !1) {
  let errors = [];
  project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH && Object.keys(project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH).forEach(key => {
    FORMER_FLAGS_THAT_ARE_ENABLED_NOW.has(key) ? errors.push(new FixableError(`The behaviour from the experimental flag ${JSON.stringify(key)} is the current behaviour now, the flag should be removed`, project.name)) : EXPERIMENTAL_FLAGS.has(key) || errors.push(new FatalError(`The experimental flag ${JSON.stringify(key)} in your config does not exist`, project.name));
  });
  for (let pkg of project.packages) {
    try {
      validatePackage(pkg);
    } catch (err) {
      if (err instanceof BatchError) errors.push(...err.errors); else {
        if (!(err instanceof FatalError)) throw err;
        errors.push(err);
      }
    }
    for (let entrypoint of pkg.entrypoints) try {
      validateEntrypoint(entrypoint, log);
    } catch (err) {
      if (err instanceof BatchError) errors.push(...err.errors); else {
        if (!(err instanceof FatalError)) throw err;
        errors.push(err);
      }
    }
  }
  if (errors.length) {
    if (1 === errors.length) throw errors[0];
    throw new BatchError(errors);
  }
}

async function validate(directory) {
  validateProject(await Project.create(directory), !0), success(successes.validProject);
}

async function doInit(pkg) {
  if (pkg.entrypoints.every(entrypoint => isFieldValid.main(entrypoint))) info(infos.validField("main"), pkg.name); else {
    if (!await confirms.writeMainField(pkg)) throw new FatalError(errors.deniedWriteMainField, pkg.name);
    pkg.setFieldOnEntrypoints("main");
  }
  let allEntrypointsAreMissingAModuleField = pkg.entrypoints.every(entrypoint => void 0 === entrypoint.json.module), someEntrypointsAreNotValid = pkg.entrypoints.some(entrypoint => !isFieldValid.module(entrypoint));
  if (allEntrypointsAreMissingAModuleField || someEntrypointsAreNotValid) {
    if (await confirms.writeModuleField(pkg)) pkg.setFieldOnEntrypoints("module"); else if (!allEntrypointsAreMissingAModuleField) throw new FixableError(errors.fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit("module"), pkg.name);
  } else info(infos.validField("module"), pkg.name);
  let someEntrypointsHaveAMaybeInvalidUmdBuild = pkg.entrypoints.some(entrypoint => void 0 !== entrypoint.json["umd:main"]), someUmdMainFieldsAreInvalid = pkg.entrypoints.some(entrypoint => !isFieldValid["umd:main"](entrypoint)), someUmdNamesAreNotSpecified = pkg.entrypoints.some(entrypoint => !isUmdNameSpecified(entrypoint));
  if (someEntrypointsHaveAMaybeInvalidUmdBuild && (someUmdMainFieldsAreInvalid || someUmdNamesAreNotSpecified)) {
    if (!await confirms.fixUmdBuild(pkg)) throw new FixableError(errors.fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit("umd:main"), pkg.name);
    pkg.setFieldOnEntrypoints("umd:main");
    for (let entrypoint of pkg.entrypoints) {
      let umdName = await promptInput(inputs.getUmdName, entrypoint);
      entrypoint.json.preconstruct.umdName = umdName;
    }
  }
  let someEntrypointsHaveABrowserField = pkg.entrypoints.some(entrypoint => void 0 !== entrypoint.json.browser), someEntrypointsHaveAnInvalidBrowserField = pkg.entrypoints.some(entrypoint => !isFieldValid.browser(entrypoint));
  if (someEntrypointsHaveABrowserField && someEntrypointsHaveAnInvalidBrowserField) {
    if (!await confirms.fixBrowserField(pkg)) throw new FixableError(errors.fieldMustExistInAllEntrypointsIfExistsDeclinedFixDuringInit("browser"), pkg.name);
    pkg.setFieldOnEntrypoints("browser");
  }
  await Promise.all(pkg.entrypoints.map(x => x.save()));
}

async function init(directory) {
  let project = await Project.create(directory);
  await Promise.all(project.packages.map(doInit)), success("initialised project!");
}

function getAliases(project) {
  let aliases = {};
  return project.packages.forEach(pkg => {
    pkg.entrypoints.forEach(entrypoint => {
      aliases[entrypoint.name] = entrypoint.source;
    });
  }), aliases;
}

const pattern = /from (["'])@babel\/runtime(|-corejs[23])\/helpers\/(\w+)["']/g;

function rewriteBabelRuntimeHelpers() {
  return {
    name: "rewrite-babel-runtime-helpers",
    renderChunk: (code, chunkInfo, {format: format}) => "es" !== format ? null : code.replace(pattern, (_, quote, maybeCorejsBit, path) => `from ${quote}@babel/runtime${maybeCorejsBit}/helpers/esm/${path}${quote}`)
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
    if ("MODULE_NOT_FOUND" === err.code) try {
      return require(resolveFrom(projectDir, "typescript"));
    } catch (err) {
      throw new FatalError("an entrypoint source file ends with the .ts or .tsx extension but the typescript module could not be resolved from the project directory, please install it.", pkgName);
    }
    throw err;
  }
}

function weakMemoize(func) {
  let cache = new WeakMap;
  return arg => {
    if (cache.has(arg)) return cache.get(arg);
    let ret = func(arg);
    return cache.set(arg, ret), ret;
  };
}

function memoize(fn) {
  const cache = {};
  return arg => (void 0 === cache[arg] && (cache[arg] = fn(arg)), cache[arg]);
}

async function nonMemoizedGetProgram(typescript, configFileName) {
  let configFileContents = await fs.readFile(configFileName, "utf8");
  const result = typescript.parseConfigFileTextToJson(configFileName, configFileContents);
  let thing = typescript.parseJsonConfigFileContent(result.config, typescript.sys, process.cwd(), void 0, configFileName);
  thing.options.declaration = !0, thing.options.emitDeclarationOnly = !0, thing.options.noEmit = !1;
  let program = typescript.createProgram(thing.fileNames, thing.options);
  return {
    options: thing.options,
    program: program
  };
}

let memoizedGetProgram = weakMemoize(typescript => memoize(async configFileName => nonMemoizedGetProgram(typescript, configFileName)));

async function getProgram(dirname, pkgName, ts) {
  let configFileName = ts.findConfigFile(dirname, ts.sys.fileExists);
  if (!configFileName) throw new FatalError("an entrypoint source file ends with the .ts or tsx extension but no TypeScript config exists, please create one.", pkgName);
  return normalizePath(configFileName) === normalizePath(path__default.join(dirname, "tsconfig.json")) ? nonMemoizedGetProgram(ts, configFileName) : memoizedGetProgram(ts)(configFileName);
}

const getDeclarationsForFile = async (filename, typescript, program, normalizedPkgDir, projectDir, diagnosticsHost) => {
  if (filename.endsWith(".d.ts")) return {
    types: {
      name: filename.replace(normalizedPkgDir, normalizePath(path__default.join(normalizedPkgDir, "dist", "declarations"))),
      content: await fs.readFile(filename, "utf8")
    },
    filename: filename
  };
  const sourceFile = program.getSourceFile(typescript.sys.useCaseSensitiveFileNames ? filename : filename.toLowerCase());
  if (!sourceFile) throw new Error(`Could not find source file at ${filename} in TypeScript declaration generation, this is likely a bug in Preconstruct`);
  const emitted = {}, otherEmitted = [], {diagnostics: diagnostics} = program.emit(sourceFile, (name, text) => {
    name.endsWith(".d.ts") ? emitted.types = {
      name: name.replace(normalizedPkgDir, normalizePath(path__default.join(normalizedPkgDir, "dist", "declarations"))),
      content: text
    } : name.endsWith(".d.ts.map") ? emitted.map = {
      name: name.replace(normalizedPkgDir, normalizePath(path__default.join(normalizedPkgDir, "dist", "declarations"))),
      content: text
    } : otherEmitted.push({
      name: name,
      text: text
    });
  }, void 0, !0);
  if (!emitted.types || diagnostics.length) throw new FatalError(`Generating TypeScript declarations for ${normalizePath(path__default.relative(projectDir, filename))} failed:\n${typescript.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost)}${otherEmitted.length ? `\n\nTypeScript emitted other files when attempting to emit .d.ts files:\n${otherEmitted.map(x => `${x.name}\n\n${x.text}`).join("\n\n")}` : ""}`, "");
  return {
    types: emitted.types,
    map: emitted.map,
    filename: filename
  };
};

function overwriteDeclarationMapSourceRoot(content, actualSourceRoot) {
  const src = JSON.parse(content);
  return src.sourceRoot = actualSourceRoot, JSON.stringify(src);
}

async function getDeclarations(dirname, pkgName, projectDir, entrypoints) {
  const typescript = loadTypeScript(dirname, projectDir, pkgName), {program: program, options: options} = await getProgram(dirname, pkgName, typescript);
  let moduleResolutionCache = typescript.createModuleResolutionCache(dirname, x => x, options), normalizedDirname = normalizePath(dirname), resolvedEntrypointPaths = entrypoints.map(x => {
    let {resolvedModule: resolvedModule} = typescript.resolveModuleName(path__default.join(path__default.dirname(x), path__default.basename(x, path__default.extname(x))), dirname, options, typescript.sys, moduleResolutionCache);
    if (!resolvedModule) throw new Error("This is an internal error, please open an issue if you see this: ts could not resolve module");
    return resolvedModule.resolvedFileName;
  }), allDeps = new Set(resolvedEntrypointPaths);
  !function searchDeps(deps) {
    for (let dep of deps) {
      let sourceFile = program.getSourceFile(dep);
      if (!sourceFile) throw new FatalError(`Could not generate type declarations because ${dep} is not in a TypeScript project. Make sure this file is included in your tsconfig.`, pkgName);
      let internalDeps = new Set;
      for (let {text: text} of sourceFile.imports) {
        let {resolvedModule: resolvedModule} = typescript.resolveModuleName(text, dep, options, typescript.sys, moduleResolutionCache);
        resolvedModule && (allDeps.has(resolvedModule.resolvedFileName) || resolvedModule.isExternalLibraryImport || !resolvedModule.resolvedFileName.includes(normalizedDirname) || resolvedModule.resolvedFileName.endsWith(".json") || (internalDeps.add(resolvedModule.resolvedFileName), 
        allDeps.add(resolvedModule.resolvedFileName)));
      }
      searchDeps(internalDeps);
    }
  }(new Set(resolvedEntrypointPaths));
  const diagnosticsHost = getDiagnosticsHost(typescript, projectDir);
  return Promise.all([ ...allDeps ].map(filename => getDeclarationsForFile(filename, typescript, program, normalizedDirname, projectDir, diagnosticsHost)));
}

let isTsPath = source => /\.tsx?/.test(source);

function typescriptDeclarations(pkg) {
  return pkg.entrypoints.some(({source: source}) => isTsPath(source)) ? {
    name: "typescript-declarations",
    async generateBundle(opts, bundle) {
      let declarations = await getDeclarations(pkg.directory, pkg.name, pkg.project.directory, pkg.entrypoints.map(x => x.source)), srcFilenameToDtsFilenameMap = new Map;
      await Promise.all([ ...declarations ].map(async output => {
        if (srcFilenameToDtsFilenameMap.set(normalizePath(output.filename), output.types.name), 
        this.emitFile({
          type: "asset",
          fileName: path__default.relative(opts.dir, output.types.name),
          source: output.types.content
        }), output.map) {
          const sourceRoot = normalizePath(path__default.dirname(path__default.relative(path__default.dirname(output.map.name), output.filename))), source = overwriteDeclarationMapSourceRoot(output.map.content, sourceRoot);
          this.emitFile({
            type: "asset",
            fileName: path__default.relative(opts.dir, output.map.name),
            source: source
          });
        }
      }));
      for (const n in bundle) {
        const file = bundle[n];
        if ("asset" === file.type || !file.isEntry || null == file.facadeModuleId) continue;
        const facadeModuleId = file.facadeModuleId;
        let dtsFilename = srcFilenameToDtsFilenameMap.get(normalizePath(facadeModuleId));
        if (!dtsFilename) throw new FatalError(`no .d.ts file was found for the entrypoint at ${facadeModuleId}`, pkg.name);
        let mainFieldPath = file.fileName.replace(/\.prod\.js$/, ""), relativeToSource = path__default.relative(path__default.dirname(path__default.join(opts.dir, file.fileName)), dtsFilename.replace(/\.d\.ts$/, ""));
        relativeToSource.startsWith(".") || (relativeToSource = `./${relativeToSource}`);
        let tsFileSource = tsTemplate(file.exports.includes("default"), normalizePath(relativeToSource)), tsFileName = mainFieldPath + ".d.ts";
        this.emitFile({
          type: "asset",
          fileName: tsFileName,
          source: tsFileSource
        });
      }
    }
  } : {
    name: "typescript-declarations"
  };
}

let tsExtensionPattern = /tsx?$/;

async function getTypeSystem(entrypoint) {
  let content = await fs.readFile(entrypoint.source, "utf8");
  return tsExtensionPattern.test(entrypoint.source) ? [ "typescript", content ] : content.includes("@flow") ? [ "flow", content ] : [ void 0, content ];
}

async function entrypointHasDefaultExport(entrypoint, content) {
  if (!/(export\s*{[^}]*default|export\s+(|\*\s+as\s+)default\s)/.test(content)) return !1;
  let ast = await babel.parseAsync(content, {
    filename: entrypoint.source,
    sourceType: "module",
    cwd: entrypoint.package.project.directory
  });
  for (let statement of ast.program.body) if ("ExportDefaultDeclaration" === statement.type || "ExportNamedDeclaration" === statement.type && statement.specifiers.some(specifier => ("ExportDefaultSpecifier" === specifier.type || "ExportNamespaceSpecifier" === specifier.type || "ExportSpecifier" === specifier.type) && "default" === specifier.exported.name)) return !0;
  return !1;
}

async function writeDevTSFile(entrypoint, entrypointSourceContent) {
  let cjsDistPath = path__default.join(entrypoint.directory, validFields.main(entrypoint)).replace(/\.js$/, ".d.ts"), output = await (entrypoint.package.project.experimentalFlags.typeScriptProxyFileWithImportEqualsRequireAndExportEquals ? `import mod = require(${JSON.stringify(normalizePath(path__default.relative(path__default.dirname(cjsDistPath), entrypoint.source).replace(/\.tsx?$/, "")))});\n\nexport = mod;\n` : entrypointHasDefaultExport(entrypoint, entrypointSourceContent).then(hasDefaultExport => "// are you seeing an error that a default export doesn't exist but your source file has a default export?\n// you should run `yarn` or `yarn preconstruct dev` if preconstruct dev isn't in your postinstall hook\n\n// curious why you need to?\n// this file exists so that you can import from the entrypoint normally\n// except that it points to your source file and you don't need to run build constantly\n// which means we need to re-export all of the modules from your source file\n// and since export * doesn't include default exports, we need to read your source file\n// to check for a default export and re-export it if it exists\n// it's not ideal, but it works pretty well ¯\\_(ツ)_/¯\n" + tsTemplate(hasDefaultExport, normalizePath(path__default.relative(path__default.dirname(cjsDistPath), entrypoint.source).replace(/\.tsx?$/, "")))));
  await fs.outputFile(cjsDistPath, output);
}

async function writeTypeSystemFile(typeSystemPromise, entrypoint) {
  let [typeSystem, content] = await typeSystemPromise;
  if (void 0 === typeSystem) return;
  let cjsDistPath = path__default.join(entrypoint.directory, validFields.main(entrypoint));
  "flow" === typeSystem && await fs.writeFile(cjsDistPath + ".flow", flowTemplate(!1, normalizePath(path__default.relative(path__default.dirname(cjsDistPath), entrypoint.source)))), 
  "typescript" === typeSystem && await writeDevTSFile(entrypoint, content);
}

async function dev(projectDir) {
  let project = await Project.create(projectDir);
  validateProject(project), info("project is valid!");
  await Promise.all(project.packages.map(pkg => Promise.all(pkg.entrypoints.map(async entrypoint => {
    let typeSystemPromise = getTypeSystem(entrypoint), distDirectory = path__default.join(entrypoint.directory, "dist");
    await fs.remove(distDirectory), await fs.ensureDir(distDirectory);
    let promises = [ writeTypeSystemFile(typeSystemPromise, entrypoint), fs.writeFile(path__default.join(entrypoint.directory, validFields.main(entrypoint)), `"use strict";\n// this file might look strange and you might be wondering what it's for\n// it's lets you import your source files by importing this entrypoint\n// as you would import it if it was built with preconstruct build\n// this file is slightly different to some others though\n// it has a require hook which compiles your code with Babel\n// this means that you don't have to set up @babel/register or anything like that\n// but you can still require this module and it'll be compiled\n\n// this bit of code imports the require hook and registers it\nlet unregister = require(${JSON.stringify(normalizePath(path__default.relative(distDirectory, path__default.dirname(require.resolve("@preconstruct/hook")))))}).___internalHook(typeof __dirname === 'undefined' ? undefined : __dirname, ${JSON.stringify(normalizePath(path__default.relative(distDirectory, project.directory)))}, ${JSON.stringify(normalizePath(path__default.relative(distDirectory, pkg.directory)))});\n\n// this re-exports the source file\nmodule.exports = require(${JSON.stringify(normalizePath(path__default.relative(distDirectory, entrypoint.source)))});\n\nunregister();\n`) ];
    if (entrypoint.json.module && promises.push(fs.symlink(entrypoint.source, path__default.join(entrypoint.directory, validFields.module(entrypoint)))), 
    entrypoint.json.browser) {
      let browserField = validFields.browser(entrypoint);
      for (let key of Object.keys(browserField)) promises.push(fs.symlink(entrypoint.source, path__default.join(entrypoint.directory, browserField[key])));
    }
    return Promise.all(promises);
  })))), await Promise.all([]), success("created links!");
}

function getDevPath(cjsPath) {
  return cjsPath.replace(/\.js$/, ".dev.js");
}

function getProdPath(cjsPath) {
  return cjsPath.replace(/\.js$/, ".prod.js");
}

async function cleanProjectBeforeBuild(project) {
  await Promise.all(project.packages.map(async pkg => {
    await Promise.all([ fs.remove(path__default.join(pkg.directory, "dist")), ...pkg.entrypoints.filter(entrypoint => entrypoint.name !== pkg.name).map(entrypoint => fs.remove(path__default.join(entrypoint.directory, "dist"))) ]), 
    await Promise.all(pkg.entrypoints.map(async entrypoint => {
      isTsPath(entrypoint.source) && (await fs.mkdir(path__default.join(entrypoint.directory, "dist")), 
      await writeDevTSFile(entrypoint, await fs.readFile(entrypoint.source, "utf8")));
    }));
  }));
}

function flowAndNodeDevProdEntry(pkg, warnings) {
  return {
    name: "flow-and-prod-dev-entry",
    load: id => "could-not-resolve" === id ? "" : null,
    async resolveId(source, importer) {
      let resolved = await this.resolve(source, importer, {
        skipSelf: !0
      });
      if (null === resolved) {
        if (!source.startsWith(".")) return warnings.push(new FatalError(`"${source}" is imported ${importer ? `by "${normalizePath(path__default.relative(pkg.directory, importer))}"` : ""} but the package is not specified in dependencies or peerDependencies`, pkg.name)), 
        "could-not-resolve";
        throw new FatalError(`Could not resolve ${source} ` + (importer ? `from ${path__default.relative(pkg.directory, importer)}` : ""), pkg.name);
      }
      return source.startsWith("\0") || resolved.id.startsWith("\0") || resolved.id.startsWith(pkg.directory) ? resolved : (warnings.push(new FatalError(`all relative imports in a package should only import modules inside of their package directory but ${importer ? `"${normalizePath(path__default.relative(pkg.directory, importer))}"` : "a module"} is importing "${source}"`, pkg.name)), 
      "could-not-resolve");
    },
    async generateBundle(opts, bundle) {
      for (const n in bundle) {
        const file = bundle[n];
        if ("asset" === file.type || "chunk" !== file.type || !file.isEntry || null == file.facadeModuleId) continue;
        let mainFieldPath = file.fileName.replace(/\.prod\.js$/, ".js"), relativeToSource = path__default.relative(path__default.dirname(path__default.join(opts.dir, file.fileName)), file.facadeModuleId);
        if (!/\.tsx?$/.test(file.facadeModuleId)) {
          let flowMode = !1;
          if ((await fs.readFile(file.facadeModuleId, "utf8")).includes("@flow") && (flowMode = file.exports.includes("default") ? "all" : "named"), 
          !1 !== flowMode) {
            let flowFileSource = flowTemplate("all" === flowMode, normalizePath(relativeToSource)), flowFileName = mainFieldPath + ".flow";
            this.emitFile({
              type: "asset",
              fileName: flowFileName,
              source: flowFileSource
            });
          }
        }
        let mainEntrySource = `'use strict';\n\nif (process.env.NODE_ENV === "production") {\n  module.exports = require("./${path__default.basename(getProdPath(mainFieldPath))}");\n} else {\n  module.exports = require("./${path__default.basename(getDevPath(mainFieldPath))}");\n}\n`;
        this.emitFile({
          type: "asset",
          fileName: mainFieldPath,
          source: mainEntrySource
        });
      }
    }
  };
}

let worker, shouldUseWorker = "true" !== process.env.DISABLE_PRECONSTRUCT_WORKER && !isCI, unsafeRequire$1 = require;

function createWorker() {
  worker = shouldUseWorker ? new Worker(require.resolve("@preconstruct/cli/worker")) : unsafeRequire$1("@preconstruct/cli/worker");
}

function destroyWorker() {
  void 0 !== worker && shouldUseWorker && (worker.end(), worker = void 0);
}

function getWorker() {
  if (void 0 === worker) throw new Error("worker not defined");
  return worker;
}

const lru = new QuickLRU({
  maxSize: 1e3
});

let extensionRegex = /\.[tj]sx?$/, externalHelpersCache = new Map;

const resolvedBabelCore = require.resolve("@babel/core"), babelHelpers = require(resolveFrom(resolvedBabelCore, "@babel/helpers")), babelGenerator = require(resolveFrom(resolvedBabelCore, "@babel/generator")), babelHelpersModuleStart = "\0rollupPluginBabelHelpers/";

function babelRuntimeVersionRangeHasHelper(name, versionRange) {
  let minVersion = babelHelpers.minVersion(name);
  return !semver.intersects(`<${minVersion}`, versionRange) && !semver.intersects(">=8.0.0", versionRange);
}

let rollupPluginBabel = ({cwd: cwd, reportTransformedFile: reportTransformedFile, babelRuntime: babelRuntime}) => {
  const babelRuntimeVersion = semver.valid(null == babelRuntime ? void 0 : babelRuntime.range) ? `^${null == babelRuntime ? void 0 : babelRuntime.range}` : null == babelRuntime ? void 0 : babelRuntime.range, resolveIdForBabelHelper = void 0 !== babelRuntimeVersion && void 0 !== babelRuntime && semver.validRange(babelRuntimeVersion) ? helper => babelRuntimeVersionRangeHasHelper(helper, babelRuntimeVersion) ? `${babelRuntime.name}/helpers/${helper}` : `\0rollupPluginBabelHelpers/${helper}` : helper => `\0rollupPluginBabelHelpers/${helper}`;
  return {
    name: "babel",
    resolveId: (id, parent) => id.startsWith(babelHelpersModuleStart) ? resolveIdForBabelHelper(id.slice(babelHelpersModuleStart.length)) : parent && parent.startsWith(babelHelpersModuleStart) ? resolveIdForBabelHelper(id) : null,
    load(id) {
      let helperName = id.replace(/\0rollupPluginBabelHelpers\//, "");
      if (helperName === id) return null;
      let helpersSourceDescription = externalHelpersCache.get(helperName);
      if (void 0 === helpersSourceDescription) {
        const helperNodes = babelHelpers.get(helperName).nodes;
        let helpers = babelGenerator.default({
          type: "Program",
          body: helperNodes
        }).code;
        helpersSourceDescription = {
          ast: this.parse(helpers, void 0),
          code: helpers
        }, externalHelpersCache.set(helperName, helpersSourceDescription);
      }
      return helpersSourceDescription;
    },
    transform(code, filename) {
      if ("string" != typeof filename || "\0" === filename[0] || !extensionRegex.test(filename) || filename.includes("node_modules")) return null;
      if (lru.has(filename)) {
        let cachedResult = lru.get(filename);
        if (code === cachedResult.code) return cachedResult.promise.then(result => {
          const ast = JSON.parse(JSON.stringify(result.ast));
          return {
            code: result.code,
            map: result.map,
            ast: ast,
            meta: {
              babel: {
                ast: ast,
                codeAtBabelTime: result.code
              }
            }
          };
        });
      }
      let promise = getWorker().transformBabel(code, cwd, filename).then(x => {
        reportTransformedFile(filename);
        const ast = this.parse(x.code, void 0);
        return {
          code: x.code,
          ast: JSON.parse(JSON.stringify(ast)),
          map: x.map,
          meta: {
            babel: {
              ast: ast,
              codeAtBabelTime: x.code
            }
          }
        };
      });
      return lru.set(filename, {
        code: code,
        promise: promise
      }), promise;
    }
  };
};

function ownKeys$2(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter((function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    }))), keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread$2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys$2(Object(source), !0).forEach((function(key) {
      _defineProperty$6(target, key, source[key]);
    })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$2(Object(source)).forEach((function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    }));
  }
  return target;
}

function _defineProperty$6(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

function terser(options) {
  return {
    name: "terser",
    renderChunk(code, chunk, outputOptions) {
      const normalizedOptions = _objectSpread$2({}, options, {
        module: "es" === outputOptions.format
      });
      return getWorker().transformTerser(code, JSON.stringify(normalizedOptions)).catch(error => {
        const {message: message, line: line, col: column} = error;
        throw console.error(codeFrame.codeFrameColumns(code, {
          start: {
            line: line,
            column: column
          }
        }, {
          message: message
        })), error;
      });
    }
  };
}

function inlineProcessEnvNodeEnv({sourceMap: sourceMap}) {
  return {
    name: "inline-process-env-node-env-production",
    transform(code, id) {
      if (code.includes("process.env.NODE_ENV")) {
        let magicString = new MagicString(code);
        const ast = (() => {
          const babelMeta = this.getModuleInfo(id).meta.babel;
          return (null == babelMeta ? void 0 : babelMeta.codeAtBabelTime) === code ? this.getModuleInfo(id).meta.babel.ast : this.parse(code);
        })();
        estreeWalker.walk(ast, {
          enter(n, p) {
            const parent = p, node = n;
            if ("MemberExpression" === node.type && !node.computed && "MemberExpression" === node.object.type && !node.object.computed && "Identifier" === node.object.object.type && "process" === node.object.object.name && "Identifier" === node.object.property.type && "env" === node.object.property.name && "Identifier" === node.property.type && "NODE_ENV" === node.property.name && isReference(node, parent) && "AssignmentExpression" !== parent.type) {
              const start = node.start, end = node.end, len = end - start;
              this.replace({
                type: "Literal",
                start: start,
                end: end,
                value: "production",
                raw: '"production"'
              }), magicString.overwrite(start, end, '"production"'.padStart(len));
            }
          }
        });
        let output = {
          code: magicString.toString(),
          ast: ast
        };
        return sourceMap && (output.map = magicString.generateMap({
          hires: !0
        })), output;
      }
      return null;
    }
  };
}

const makeExternalPredicate = externalArr => {
  if (0 === externalArr.length) return () => !1;
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`);
  return id => pattern.test(id);
};

let getRollupConfig = (pkg, entrypoints, aliases, type, reportTransformedFile) => {
  let external = [];
  pkg.json.peerDependencies && external.push(...Object.keys(pkg.json.peerDependencies)), 
  pkg.json.dependencies && "umd" !== type && external.push(...Object.keys(pkg.json.dependencies)), 
  "node-dev" !== type && "node-prod" !== type || external.push(...builtInModules);
  let input = {};
  entrypoints.forEach(entrypoint => {
    input[path__default.relative(pkg.directory, path__default.join(entrypoint.directory, "dist", getNameForDistForEntrypoint(entrypoint)))] = entrypoint.source;
  });
  let warnings = [];
  return {
    input: input,
    external: makeExternalPredicate(external),
    onwarn: warning => {
      if ("string" != typeof warning) switch (warning.code) {
       case "CIRCULAR_DEPENDENCY":
       case "EMPTY_BUNDLE":
       case "EVAL":
       case "UNUSED_EXTERNAL_IMPORT":
        break;

       case "UNRESOLVED_IMPORT":
        if (!warning.source.startsWith(".")) return void warnings.push(new FatalError(`"${warning.source}" is imported by "${normalizePath(path__default.relative(pkg.directory, warning.importer))}" but the package is not specified in dependencies or peerDependencies`, pkg.name));

       case "THIS_IS_UNDEFINED":
        if ("umd" === type) return;
        return void warnings.push(new FatalError(`"${normalizePath(path__default.relative(pkg.directory, warning.loc.file))}" used \`this\` keyword at the top level of an ES module. You can read more about this at ${warning.url} and fix this issue that has happened here:\n\n${warning.frame}\n`, pkg.name));

       default:
        warnings.push(new FatalError(`An unhandled Rollup error occurred: ${chalk.red(warning.toString())}`, pkg.name));
      } else warnings.push(new FatalError(`An unhandled Rollup error occurred: ${chalk.red(warning.toString())}`, pkg.name));
    },
    plugins: [ {
      name: "throw-warnings",
      buildEnd() {
        if (warnings.length) throw new BatchError(warnings);
      }
    }, "node-prod" === type && flowAndNodeDevProdEntry(pkg, warnings), "node-prod" === type && typescriptDeclarations(pkg), rollupPluginBabel({
      cwd: pkg.project.directory,
      reportTransformedFile: reportTransformedFile,
      babelRuntime: (() => {
        for (const dep of [ "@babel/runtime", "@babel/runtime-corejs2", "@babel/runtime-corejs3" ]) {
          var _pkg$json$dependencie;
          const range = null === (_pkg$json$dependencie = pkg.json.dependencies) || void 0 === _pkg$json$dependencie ? void 0 : _pkg$json$dependencie[dep];
          if (void 0 !== range) return {
            range: range,
            name: dep
          };
        }
      })()
    }), "umd" === type && cjs({
      include: [ "**/node_modules/**", "node_modules/**" ]
    }), rewriteBabelRuntimeHelpers(), json({
      namedExports: !1
    }), "umd" === type && alias({
      entries: aliases
    }), resolve({
      extensions: EXTENSIONS,
      browser: "umd" === type,
      customResolveOptions: {
        moduleDirectory: "umd" === type ? "node_modules" : []
      }
    }), "umd" === type && inlineProcessEnvNodeEnv({
      sourceMap: !0
    }), "umd" === type && terser({
      sourceMap: !0,
      compress: !0
    }), "node-prod" === type && inlineProcessEnvNodeEnv({
      sourceMap: !1
    }), ("browser" === type || "umd" === type) && replace({
      values: {
        "typeof document": JSON.stringify("object"),
        "typeof window": JSON.stringify("object")
      },
      preventAssignment: !0
    }) ].filter(x => !!x)
  };
};

function getGlobal(project, name) {
  if (void 0 !== project.json.preconstruct.globals && project.json.preconstruct.globals[name]) return project.json.preconstruct.globals[name];
  try {
    let pkgJson = require(resolveFrom(project.directory, path__default.join(name, "package.json")));
    if (pkgJson && pkgJson[PKG_JSON_CONFIG_FIELD] && pkgJson[PKG_JSON_CONFIG_FIELD].umdName) return pkgJson[PKG_JSON_CONFIG_FIELD].umdName;
  } catch (err) {
    if ("MODULE_NOT_FOUND" !== err.code && "ERR_PACKAGE_PATH_NOT_EXPORTED" !== err.code) throw err;
  }
  throw limit(() => (async () => {
    if (void 0 !== project.json.preconstruct.globals && project.json.preconstruct.globals[name]) return;
    let response = await doPromptInput(`What should the umdName of ${name} be?`, project);
    project.json.preconstruct.globals || (project.json.preconstruct.globals = {}), project.json.preconstruct.globals[name] = response, 
    await project.save();
  })());
}

const babelHelperId = /@babel\/runtime(|-corejs[23])\/helpers\//, interop = id => id && babelHelperId.test(id) ? "default" : "auto";

function getRollupConfigs(pkg, aliases) {
  const cjsPlugins = pkg.project.experimentalFlags.keepDynamicImportAsDynamicImportInCommonJS ? [ {
    name: "cjs render dynamic import",
    renderDynamicImport: () => ({
      left: "import(",
      right: ")"
    })
  } ] : [];
  let configs = [], hasModuleField = void 0 !== pkg.entrypoints[0].json.module;
  return configs.push({
    config: getRollupConfig(pkg, pkg.entrypoints, aliases, "node-dev", pkg.project.experimentalFlags.logCompiledFiles ? filename => {
      info("compiled " + filename.replace(pkg.project.directory + path__default.sep, ""));
    } : () => {}),
    outputs: [ {
      format: "cjs",
      entryFileNames: "[name].cjs.dev.js",
      chunkFileNames: "dist/[name]-[hash].cjs.dev.js",
      dir: pkg.directory,
      exports: "named",
      interop: interop,
      plugins: cjsPlugins
    }, ...hasModuleField ? [ {
      format: "es",
      entryFileNames: "[name].esm.js",
      chunkFileNames: "dist/[name]-[hash].esm.js",
      dir: pkg.directory
    } ] : [] ]
  }), configs.push({
    config: getRollupConfig(pkg, pkg.entrypoints, aliases, "node-prod", () => {}),
    outputs: [ {
      format: "cjs",
      entryFileNames: "[name].cjs.prod.js",
      chunkFileNames: "dist/[name]-[hash].cjs.prod.js",
      dir: pkg.directory,
      exports: "named",
      interop: interop,
      plugins: cjsPlugins
    } ]
  }), void 0 !== pkg.entrypoints[0].json["umd:main"] && pkg.entrypoints.forEach(entrypoint => {
    configs.push({
      config: getRollupConfig(pkg, [ entrypoint ], aliases, "umd", () => {}),
      outputs: [ {
        format: "umd",
        sourcemap: !0,
        entryFileNames: "[name].umd.min.js",
        name: entrypoint.json.preconstruct.umdName,
        dir: pkg.directory,
        interop: interop,
        globals: name => name === entrypoint.json.preconstruct.umdName ? name : getGlobal(pkg.project, name)
      } ]
    });
  }), void 0 !== pkg.entrypoints[0].json.browser && configs.push({
    config: getRollupConfig(pkg, pkg.entrypoints, aliases, "browser", () => {}),
    outputs: [ {
      format: "cjs",
      entryFileNames: "[name].browser.cjs.js",
      chunkFileNames: "dist/[name]-[hash].browser.cjs.js",
      dir: pkg.directory,
      exports: "named",
      interop: interop,
      plugins: cjsPlugins
    }, ...hasModuleField ? [ {
      format: "es",
      entryFileNames: "[name].browser.esm.js",
      chunkFileNames: "dist/[name]-[hash].browser.esm.js",
      dir: pkg.directory
    } ] : [] ]
  }), configs;
}

let SOURCEMAPPING_URL = "sourceMa";

function writeOutputFile(outputFile, outputOptions) {
  const fileName = path__default.resolve(outputOptions.dir || path__default.dirname(outputOptions.file), outputFile.fileName);
  let writeSourceMapPromise, source;
  if ("asset" === outputFile.type) source = outputFile.source; else if (source = outputFile.code, 
  outputOptions.sourcemap && outputFile.map) {
    let url;
    "inline" === outputOptions.sourcemap ? url = outputFile.map.toUrl() : (url = `${path__default.basename(outputFile.fileName)}.map`, 
    writeSourceMapPromise = fs.outputFile(`${fileName}.map`, outputFile.map.toString())), 
    "hidden" !== outputOptions.sourcemap && (source += `//# ${SOURCEMAPPING_URL}=${url}\n`);
  }
  return Promise.all([ fs.outputFile(fileName, source), writeSourceMapPromise ]);
}

async function buildPackage(pkg, aliases) {
  let configs = getRollupConfigs(pkg, aliases), outputs = await Promise.all(configs.map(async ({config: config, outputs: outputs}) => {
    let bundle = await rollup.rollup(config);
    return Promise.all(outputs.map(async outputConfig => ({
      output: (await bundle.generate(outputConfig)).output,
      outputConfig: outputConfig
    })));
  }));
  await Promise.all(outputs.map(x => Promise.all(x.map(bundle => Promise.all(bundle.output.map(output => writeOutputFile(output, bundle.outputConfig)))))));
}

async function retryableBuild(pkg, aliases) {
  try {
    await buildPackage(pkg, aliases);
  } catch (err) {
    if (err instanceof Promise) return await err, void await retryableBuild(pkg, aliases);
    if (err instanceof FatalError || err instanceof BatchError || err instanceof ScopelessError) throw err;
    if ("BABEL_PARSE_ERROR" === err.pluginCode) throw new ScopelessError(err.message);
    throw new UnexpectedBuildError(err, pkg.name);
  }
}

async function build(directory) {
  try {
    createWorker();
    let project = await Project.create(directory);
    validateProject(project), info("building bundles!"), await cleanProjectBeforeBuild(project);
    let aliases = getAliases(project), errors = [];
    if (await Promise.all(project.packages.map(async pkg => {
      try {
        await retryableBuild(pkg, aliases);
      } catch (err) {
        err instanceof BatchError ? errors.push(...err.errors) : errors.push(err);
      }
    })), errors.length) throw new BatchError(errors.sort((a, b) => (a.scope + a.message).localeCompare(b.scope + b.message)));
    success("built bundles!");
  } finally {
    destroyWorker();
  }
}

function ownKeys$3(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter((function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    }))), keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread$3(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys$3(Object(source), !0).forEach((function(key) {
      _defineProperty$7(target, key, source[key]);
    })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$3(Object(source)).forEach((function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    }));
  }
  return target;
}

function _defineProperty$7(obj, key, value) {
  return key in obj ? Object.defineProperty(obj, key, {
    value: value,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : obj[key] = value, obj;
}

function relativePath(id) {
  return path__default.relative(process.cwd(), id);
}

async function watchPackage(pkg, aliases) {
  let configs = getRollupConfigs(pkg, aliases).map(config => _objectSpread$3({}, config.config, {
    output: config.outputs
  }));
  const watcher = rollup.watch(configs);
  let reject, startResolve, errPromise = new Promise((resolve, _reject) => {
    reject = _reject;
  }), startPromise = new Promise(resolve => {
    startResolve = resolve;
  });
  return watcher.on("event", event => {
    switch (event.code) {
     case "ERROR":
      reject(event.error);
      break;

     case "START":
      startResolve();
      break;

     case "BUNDLE_START":
      info(chalk.cyan(`bundles ${chalk.bold("string" == typeof event.input ? relativePath(event.input) : Array.isArray(event.input) ? event.input.map(relativePath).join(", ") : Object.values(event.input).map(relativePath).join(", "))} → ${chalk.bold(event.output.map(relativePath).join(", "))}...`), pkg.name);
      break;

     case "BUNDLE_END":
      info(chalk.green(`created ${chalk.bold(event.output.map(relativePath).join(", "))} in ${chalk.bold(ms(event.duration))}`), pkg.name);
      break;

     case "END":
      info("waiting for changes...", pkg.name);
    }
  }), {
    error: errPromise,
    start: startPromise
  };
}

async function retryableWatch(pkg, aliases, getPromises, depth) {
  try {
    let {error: error, start: start} = await watchPackage(pkg, aliases);
    0 === depth && getPromises({
      start: start
    }), await error;
  } catch (err) {
    if (err instanceof Promise) return await err, void await retryableWatch(pkg, aliases, getPromises, depth + 1);
    throw err;
  }
}

async function build$1(directory) {
  createWorker();
  let project = await Project.create(directory);
  validateProject(project), await cleanProjectBeforeBuild(project);
  let aliases = getAliases(project), startCount = 0;
  await Promise.all(project.packages.map(pkg => retryableWatch(pkg, aliases, async ({start: start}) => {
    await start, ++startCount === project.packages.length && success(successes.startedWatching);
  }, 0)));
}

async function fixEntrypoint(entrypoint) {
  if (void 0 !== entrypoint.json["umd:main"] && !isUmdNameSpecified(entrypoint)) {
    let umdName = await promptInput(inputs.getUmdName, entrypoint);
    return entrypoint.json.preconstruct.umdName = umdName, await entrypoint.save(), 
    !0;
  }
  return !1;
}

async function fix(directory) {
  let project = await Project.create(directory, !0), didModifyProject = !1;
  if (project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH) {
    let errors = [];
    if (Object.keys(project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH).forEach(key => {
      FORMER_FLAGS_THAT_ARE_ENABLED_NOW.has(key) ? (didModifyProject = !0, delete project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH[key]) : EXPERIMENTAL_FLAGS.has(key) || errors.push(new FatalError(`The experimental flag ${JSON.stringify(key)} in your config does not exist`, project.name));
    }), didModifyProject && (0 === Object.keys(project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH).length && delete project.json.preconstruct.___experimentalFlags_WILL_CHANGE_IN_PATCH, 
    await project.save()), errors.length) throw new BatchError(errors);
  }
  let didModifyPackages = (await Promise.all(project.packages.map(async pkg => {
    let didModifyInPkgFix = await fixPackage(pkg), didModifyInEntrypointsFix = (await Promise.all(pkg.entrypoints.map(fixEntrypoint))).some(x => x);
    return didModifyInPkgFix || didModifyInEntrypointsFix;
  }))).some(x => x);
  success(didModifyProject || didModifyPackages ? "fixed project!" : "project already valid!");
}

SOURCEMAPPING_URL += "ppingURL", process.env.NODE_ENV = "production";

let {input: input} = meow("\nUsage\n  $ preconstruct [command]\nCommands\n  init         initialise a project\n  build        build the project\n  watch        start a watch process to build the project\n  validate     validate the project\n  fix          infer as much information as possible and fix the project\n  dev          create links so entrypoints can be imported\n\n", {}), errors$1 = {
  commandNotFound: "Command not found"
};

class CommandNotFoundError extends Error {}

(async () => {
  if (1 !== input.length) throw new CommandNotFoundError;
  switch (input[0]) {
   case "init":
    return void await init(process.cwd());

   case "validate":
    return void await validate(process.cwd());

   case "build":
    return void await build(process.cwd());

   case "watch":
    return void await build$1(process.cwd());

   case "fix":
    return void await fix(process.cwd());

   case "dev":
    return void await dev(process.cwd());

   default:
    throw new CommandNotFoundError;
  }
})().catch(err => {
  let hasFixableError = !1;
  if (err instanceof FixableError) hasFixableError = !0, error(err.message, err.scope); else if (err instanceof FatalError) error(err.message, err.scope); else if (err instanceof BatchError) for (let fatalError of err.errors) fatalError instanceof FixableError ? (hasFixableError = !0, 
  error(fatalError.message, fatalError.scope)) : error(fatalError.message, fatalError.scope); else err instanceof CommandNotFoundError ? error(errors$1.commandNotFound) : err instanceof UnexpectedBuildError ? error(err.message, err.scope) : err instanceof ScopelessError ? log(err.message) : error(err);
  hasFixableError && info("Some of the errors above can be fixed automatically by running preconstruct fix"), 
  info("If want to learn more about the above error, check https://preconstruct.tools/errors"), 
  info("If the error is not there and you want to learn more about it, open an issue at https://github.com/preconstruct/preconstruct/issues/new"), 
  process.exit(1);
});
