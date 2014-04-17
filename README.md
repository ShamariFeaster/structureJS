structureJS
===========

1. Break your app up into seperate files.
2. Create  reusable, configurable modules.
3. Declare the structure of the app in any order and structureJS will resolve order dependency automatically.
4. Minify and combine all modules and files into a single file right from your browser.
5. Utilize module dependencies easily and add semantic meaning to your modules
6. Only puts one variable into the global namespace
7. Partially AMD compliant (works with jQuery AMD for now, more to come)


This 11kB (uncompressed) program allows you to break up complex Javacript apps into multiple files and reusable modules. It handles the complexity of making sure your files are imported in the right order. Use a manifest to modify the entire structure of you app in one file. 

If you write Javascript applications and you want a simple, lightweight way to efficiently organize your code give it a try

### Why I Made structureJS ###

Having a complex app as one big file is a terrible idea but Javascript was not really designed to build complex apps so there is no native support for importing files. You have to import scripts using `script` tags and the files themselves are imported asynchronously. This means you can not be sure that a script declared first will actually be done importing first. If you have a script declared underneath the first one that is supposed to use parts of the first one you're screwed.

### How Do I Use It ###

You need one  `script` tag and a couple of `data`  attributes in that tag to bootstrap an app with structureJS

```html
<script id="structureJS"
    data-manifest="manifest"
    data-config="config"
    data-uglify="false"
    data-is-combined="false"
    src="structureJS/structureJS.js"/>
```
`id` - (required) must be "structureJS"

`src` - (required) This points to the structureJS `structureJS.js` bootstrap file.

`data-manifest` - (required) This is where you declare the files your app will use and each file's dependencies. **Must be in the directory specified in `config.structureJS_base`.**

`data-config` - (optional) If you wish to use your own directory structure, modules available to all other modules (utilities for example), or gloabl scripts (jQuery for example) you use a config file and declare its name here. It doesn't have to be "config", it can be called whatever you want. **Must be in the directory specified in `config.structureJS_base`.**

`data-uglify` - (optional) When true, your app is combined, minified, & mangled using UglifyJS then downloaded right in your browser.

`data-is-combined` - (optional) When true, set `src` attribute to the result of the uglification decribed above and your app will use the compressed version.

The typical directory structure looks like:
```

|-myAppDirectory (dir)(You can call this whatever you want)
|--|myapp.html (declaring the manifest and config files)
|
|-structureJS (dir)(You can call this whatever you want)
|--|-structureJS.js (structureJS bootstrap file.) (Required)
|--|-manifest.js (Read further to learn what this is) (Required)
|--|-config.js (Read further to learn what this is) (Optional)
|--|-structureJSCompress.js (Required to minify your app) (optional)
|--|-uglifyjs.min.js (Required to minify your app) (optional) 
|
|-ModulesDirectory (dir) (You can call this whatever you want)
|--|-file1.js (This is where you define your modules)
```

### Importing Files ###

You can tell structureJS to import files using a call to `structureJS.define()` (in manfiset.js), `structureJS.config.commons`, or `structureJS.config.globals`. The difference between the methods is that if you use `structureJS.define()` you are creating a module that can be accessed by other modules using the `require` function described later. 

The files you declare for import using `structureJS.config.commons` or `structureJS.config.globals` won't be automatically converted to modules unless they are AMD compliant (like jQuery for example). That being said, the file declared there can create and utilize modules created using `structureJS.module()`. 

#### Multiple Modules In A Single File ####

This is possible. Be aware that you loose the ability to have the import order automatically resolved by structureJS. Any intra-file dependencies have to be resolved by you by putting the dependencies above their dependents.


### Example Config File ###

Set up your app here.

**config.js**
```javascript
structureJS.config = {
  structureJs_base : 'scripts/structureJs/',
  module_base : 'scripts/structureJs/Modules/',
  global_base : 'scripts/structureJs/lib/',
  directory_aliases : {driver : 'drivers/'},
  commons : ['Util'],
  globals : ['nastyGloablPollution']
};
```
`structureJs_base` - (required) Path to where structureJS lives.

`module_base` - (required) Defualt path to all files your app uses.

`global_base` - (required) Path to the files you declare in the `globals` config array.

`commons` - (optional) Names of files your app uses. These modules are available to all the other modules of you app. Basically declare your utility scripts here. **Can be an empty array.**

`globals` - (optional) File names of scripts your app will use globally. WARNING: These files will pollute the global namespace. In some cases you may be OK with that so I put the option in here to support that. **Can be an empty array.**

`directory_aliases` - (optional) Path to other files in your app. See instructions below

#### Directory Aliasing ####

By default structureJS give you two places to put your app's files, `module_base` and `global_base`. You may want to use file from other locations. For example, you may have your driver scripts containing the application logic. These aren't modules so you probably wouldn't want to dump them into the default `Modules/` folder. Say you want to put them in a folder one level above your HTML page in a folder called `drivers/`.

Add the following to the config object:
```javascript
structureJS.config = {
 //other config object stuff
 directory_aliases : {driver : '../drivers/'},
 //other config object stuff
};
````

Now when you declare the file in your manifest you could put `driver` in front of the filename instead of `../drivers/` like so: 

`structureJS.module('driver/MyDriver');`

Now you can change the location of your drivers once in the config object and all your imports will still work. Or you can use the aliases to add semantic meaning to the import of files liek we did by using the word 'driver' before our module.

Another great use of aliasing is it allows you to keep your module collection outside of any one project but make use of them from any project.

For example, you could keep your module collection somewhere on your server and alias your module import directory to access them.

```javascript
structureJS.config = {
 //other config object stuff
 directory_aliases : {mod-lib : '../../module_repo/'},
 //other config object stuff
};
```

**NOTE:** All paths are relative to the location of HTML file the structureJS script tag.

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

All files used have to be declare in their own call to `declare`. If you name something as a dependency that hasn't been declared structureJS will cry and not load.

Note that what we are declaring here are file names, not modules. A single file can have as many modules as you want. That being said, if there dependencies between modules within a single file you must order your modules so that dependencies are at the top.

NOTE: `file1` cannot depend on `file2` while `file2` depends on `file1`. This is called a **circular dependency** and structureJS currently does not support this design pattern.

### Modules ###

structureJS also lets your create and use modules. Modules are designed to provide bits of functionality to an app. For example I have a module that provides timing functions such as determining execution times and date formatting. I do this kind thing a lot, so by writing it as a module I can drop it into any of my apps quickly using structureJS.

Modules in structureJS are declared like this:

**Time.js**
```javascript
/*NOTE: You don't have to name the module the same as the file*/
structureJS.module('Time', function(require){
    var format = require('formatter');
    return {
      /*whatever functionality you want to expose to other
        modules*/
    };
});
```

Those modules are given access to their dependencies using a function passed into them called `require`. **Any modules in files imported before the one you are using are available to you through the require function.** Using `require` performs two essential functions:

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

**NOTE: **Currently, any imports declared using `structureJS.module()` must return a value. If your module doesn't need to to return anything to be used by other parts of you app, then you should probably not use a module. See **Using Require Function In Non-Modules** for info on how to utilize modules in non-module files.

### Maintainability Through Module Semantics ###

structureJS has some lightweight features that let you write self documenting code. When you define a module you can pass the module a `configuration` object contains important data to bootstrap the module as well as semantic data.

Instead of a `name` string like in **file1.js**, we pass this module an object. Notice we define a module `type`. This `type` is purely semantic. It should describe the modules high-level function. For example is it a service? Or a singleton? Or a class?

**Module1.js**
```javascript
structureJS.module({name: 'module1', type : 'class'}, function(require){
    console.log('Hello From module1');
    return {rUwasted: 'hell yea!'};
});  
```

This improve reuse because, at a glance, you can know a modules high level function. 

In structureJS a module can read the semantic data of other objects using the `require` function. 

**Module2.js**
```javascript
structureJS.module('module1', function(require){
    var module1 = require._class('module1');   //1
    var $       = require.amd('jquery');       //2

    console.log(require.getType('module1'));  //3   prints 'class'
    console.log(require.getType('jqeury'));   //4   prints 'amd'
    return {};
});   
```

The example above shows some of the current semantic capabilities available structureJS modules. The require function has aliases attached to it that help specify what you are importing. At line 1, we use the `_class` alias to inform the user `module1` is a class. So even if we didn't print the module type like at line 3, a reader would know right away `module1` is a class that can be instantiated. 

The same goes for modules loaded using AMD. They are automatically assigned a type of `amd` and can be imported using the `amd` alias of `require`.

This is an experimental way to put documentation in the code. This may or may not be removed later on.

***Using Require Function In Non-Modules***

Remember structureJS is not just about creating modules. In fact you could use structureJS and never use a module. You could use it to synchronize your script load order and never touch the module functionality. 

If your main processing logic won't have potential re-usability then it really doesn't make sense to put it in a module. But you still want access to all those sweet modules your main script depends on, right?

structureJS let's you use the `structureJS.require` function. This is just an alias of the `require` function you use inside of modules so it works exactly the same way. 

### Minification Using Just Your Browser ###

structureJS uses the awesome work of UglifyJS to let you combine, compress, and mangle your app into a single file. structureJS will combine your files in the correct order. Currently, to download the compressed file you must have an HTML5 compliant browser. Do yourself a favor and just use Chrome. 

To minify your project simply set the `data-uglify` atrribute to true like shown below. The next time you run your app structureJS and UglifyJS will work their magic and produce you a super sweet combined and minified version of your project.

```html
<script id="structureJS"
    data-manifest="structureJS/manifest"
    data-config="structureJS/config"
    data-uglify="true"
    src="structureJS/structureJS.js"/>
```

It's a good idea to keep the `data-uglify` attribute in the tag at all times. This way you don't have to paste it in everytime you want to minify. Just keep it set to false until you're ready to minify your app.

**NOTE:** For Chrome extensions, you will need to add `unsafe-eval` option to your content security policy object in your manifest. UglifyJS needs to use eval to work. Since minification doesn't need to be done in production you can simply remove this permission before deployment.

`"content_security_policy": "script-src 'self' 'unsafe-eval' ; object-src 'self'"`

See: https://developer.chrome.com/extensions/contentSecurityPolicy

### Using The Minified Version In Production ###

like all things in structureJS using the results of the minification is really easy. No need to mess around with config files or anything like that. Simply let structureJS know by setting the `data-is-combined` atrribute to true like shown below and set the `src` attribute the location of the minified version.

```html
<script id="structureJS"
    data-manifest="structureJS/manifest"
    data-is-combined="true"
    src="my-minified-version.js"/>
```

You don't have to change anything else in your project. Once you set this attribute in the HTML, structureJS knows not to worry about your module declarations or dependency resolution. Simple.

**NOTE:** `data-manifest` attribute NOT required when using a combined, minifed version but it's a good idea to leave it in if you are not in production. Keeps you from having to paste it back in when you need to go back to the un-combined form.

### AMD Compliance ###

Currently structureJS is partially AMD compliant. JQuery is the only AMD compliant library I have tested it with. That being said, hopefully I can get some help from the community to bring structureJS into full compliance.

### Where The Project Is Headed ###

Considering I've only been working on it for about 24 hours, I have no idea. I am going to put it on GitHub tonight and hopefully I can get a community to help me make it better.
