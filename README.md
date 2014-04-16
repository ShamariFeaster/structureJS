structureJS
===========

This 11kB (uncompressed) program allows you to break up complex Javacript apps into multiple files and reusable modules. It handles the complexity of making sure your files are imported in the right order. Use a manifest to modify the entire structure of you app in one file. 

If you write Javascript applications and you want a simple, lightweight way to efficiently organize your code give it a try

### Why I Made structureJS ###

Having a complex app is one big file is a terrible idea but Javascript was not really designed to build complex apps so there is no native support for importing files. You have to import scripts using `script` tags and the files themselves are imported asynchronously. This means you can not be sure that a script declared first will actually be done importing first. If you have a script declared underneath the first one that is supposed to use parts of the first one you're screwed.

### How Do I Use It ###

You need one  `script` tag and a couple of `data`  attributes (one required and the other optional)  in that tag to bootstrap an app with structureJS

```html
<script id="structureJS"
    data-manifest="structureJS/manifest"
    data-config="structureJS/config"
    src="structureJS/structureJS.js"/>
```
`id` - (required) must be "structureJS"

`src` - (required) This points to the structureJS `Bootstrap.js` file.

`data-manifest` - (required) This is where you declare the files your app will use and each file's dependencies.

`data-config` - (optional) If you wish to use your own directory structure, modules available to all other modules (utilities for example), or gloabl scripts (jQuery for example) you use a config file and declare its name here. It doesn't have to be "config", it can be called whatever you want

The typical directory structure looks like:
```

|-myAppDirectory (dir)(You can call this whatever you want)
|--|myapp.html (declaring the manifest and config files)
|
|-structureJS (dir)(You can call this whatever you want)
|--|-structureJS.js (structureJS bootstrap file.) (Required)
|--|-manifest.js (Read further to learn what this is) (Required)
|--|-config.js (Read further to learn what this is) (Optional)
|
|-ModulesDirectory (dir) (You can call this whatever you want)
|--|-file1.js (This is where you define your modules)
```
#### Example Config File ####

**config.js**
```javascript
structureJS.config = {
  module_base : 'scripts/structureJs/Modules/',
  global_base : 'scripts/structureJs/lib/',
  commons : ['Util'],
  globals : ['nastyGloablPollution']
};
```
`module_base` - (required) Path to where you put your modules.

`global_base` - (required) Path to where you put your scripts that should be available globally.

`commons` - (required) Names of files that house modules. These modules are available to all the other modules of you app. Basically declare your utility scripts here.

`globals` - (required) File names of scripts your app will use globally. WARNING: These files will pollute the global namespace. In some cases you may be OK with that so I put the option in here to support that

### The Manifest File ###

Having one script depend on another's existence to function correctly is called a **dependency**. Managing dependencies in Javascript is notoriously difficult unless you use a program like RequireJS to deal with ordering things. Managing how and when scripts are loaded is called **dependency management**.

structureJS performs dependency management by using a **manifest**. The manifest is where you declare the files your app will use and what other files those files depend on. Once you declare the structure of the app, structureJS makes sure the importation order is correct so that no script fail because their dependencies were loaded after them. This is called **dependency resolution**.

#### Example Manifest File ####

**manifest.js**
```javascript
structureJS.declare('file1',['jquery','file2']);
structureJS.declare('file1', ['file3','jquery']);
structureJS.declare('file3');
structureJS.declare('jquery');
```
The central idea behind the manifest file is it provides a central place that you can go to manage the structure of your app. It doesn't matter what order you declare the modules in, structureJS will handle the dependency resolution and make sure files are imported in the order required for everything to work.

Note that what we are declaring here are file names, not modules. A single file can have as many modules as you want. That being said, if there dependencies between modules within a single file you must order your modules so that dependencies are at the top.

NOTE: `file1` cannot depend on `file2` while `file2` depends on `file1`. This is called a **circular dependency** and structureJS currently does not support this design pattern.

### Modules ###

Modules in structureJS are declared like this:

**file1.js**
```javascript
/*NOTE: You don't have to name the module the same as the file*/
structureJS.module('module1', function(require){
    var blah = require('moduleX');
    return {
      /*whatever functionality you want to expose to other
        modules*/
    };
});
```

structureJS also lets your create and use modules. Those modules are given access to their dependencies using a function passed into them called `require`. **Any modules in files imported before the one you are using are available to you through the require function.** Using `require` performs two essential functions:

1. Semantically: You can look at a module and quickly know what other modules it expects to use.
2. Syntactically: It Lets you know if those dependencies are there or not.

For example, if you have declared that your app will use jQuery you would use it in a module like this:

**file1.js**
```javascript
structureJS.module('module1', function(require){
    var $ = require('jquery');
    //rest of you module
});
```

A module could be a class or it could be some logic or anything you want it to be. `this` inside modules is the window object so you can operate on that level if you wish. Making changes to the DOM using jQuery would be a good example of this.

### AMD Compliance ###

Currently structureJS is partially AMD compliant. JQuery is the only AMD compliant library I have tested it with. That being said, hopefully I can get some help from the community to bring structureJS into full compliance.

### Where The Project Is Headed ###

Considering I've only been working on it for about 24 hours, I have no idea. I am going to put it on GitHub tonight and hopefully I can get a community to help me make it better.
