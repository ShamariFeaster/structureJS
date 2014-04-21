structureJS
===========

structureJS is a Javascript development tool. You will never write a Javascript app in one big, messy file ever again. 

With structureJS you are able to keep the structure of your Javascript app logically and physically separated into files, modules, and groups. You are able to view and change that structure from a single manifest file. Yet when it's time to deploy your app, you are able to deploy a single, compressed file - the tool you used to gain all this functionality adding almost nothing to the size or processing overhead of your deployment. This is the power of structureJS. 

It is designed specificallty to fit in with your existing stack and will not get in the way of any other Javascript tools or frameworks in your developement stack (AngularJS for exaple). Once you use strucreJS to organize and modularize your projects, you will never go back to the old way.

Use structureJS to:

1. Keep your app broken up into several files, modules, or groups
2. Automatic dependency ordering and resolution
2. Compatible with frameworks such as AngularJS
3. 3kB deployment size
2. Create reusable, configurable modules.
3. Share your modules or use other people's over the Internet - no downloading required
4. View & modify the structure of your app from a single manifest file
5. Minify and combine modules, files, or entire project into a single file using only your browser. Deploy in seconds not minutes
5. Utilize module dependencies easily
6. Only puts one variable into the global namespace
7. Partially AMD compliant (works with jQuery AMD for now, more to come)
8. Logically group files and modules, export those groups to combined, compressed files 
9. Automatic global dependency checking



If you write Javascript applications and you want a simple, lightweight way to efficiently organize your code give it a try

### Why I Made structureJS ###

Having a complex app as one big file is a terrible idea but Javascript was not really designed to build complex apps so there is no native support for importing files. You have to import scripts using `<script>` tags and the files themselves are imported asynchronously. This means you can not be sure that a script declared first will actually be done importing first. If you have a script declared underneath the first one that is supposed to use parts of the first one you're screwed.

### What Is structureJS ###

Essentilly what structureJS does is allow you flexibly structure a web application during development. Once you are ready to deploy your app, you can use structureJS to combine and minify your entire project into a single Javascript file. 

In deployment structureJS adds virtually no weight to an app because all of the dependency resolution code is automatically removed along with the UglifyJS library. 

In production structureJS will not slow you app down because it does nothing besides exectue the functions contained in your modules. That's it. Nothing else.

structureJS does all of this using pure Javascript. You don't have to have node.js or php installed to use it. 

### How Do I Use It ###

You need one  `script` tag and a couple of `data`  attributes in that tag to bootstrap an app with structureJS

```html
<script id="structureJS"
    data-manifest="manifest"
    data-config="config"
    data-uglify-target="*"
    src="structureJS/structureJS.js"/>
```
`id` - (required) must be "structureJS"

`src` - (required) This points to the structureJS `structureJS.js` bootstrap file.**path relative to the HTML file containing this script tag**

`data-manifest` - (required) This is where you declare the files your app will use and each file's dependencies. **path relative to the structureJS.js script NOT the HTML file containing this script tag**

`data-config` - (optional) If you wish to use your own directory structure, modules available to all other modules (utilities for example), or gloabl scripts (jQuery for example) you use a config file and declare its name here. It doesn't have to be "config", it can be called whatever you want. **path relative to the structureJS.js script NOT the HTML file containing this script tag**

`data-uglify-target` - (optional) This attribute tells structureJS to combine and/or minify a single file, a groups of files, or your entire app using UglifyJS right in your browser. The results can be downloaded, output to the console, opened in new windows - whatever you choose.


The typical directory structure looks like:
```
|-structureJS-master-copy(use one copy for all your projects)
|-|-structureJS.js (structureJS bootstrap file.) (Required)
|-|-structureJSCompress.js (Required to minify your app) (optional)
|-|-uglifyjs.min.js (Required to minify your app) (optional)
|
|-myAppDirectory (dir)(You can call this whatever you want)
|--|myapp.html (declaring the manifest and config files)
|
|--|-structureJS (dir) (you could name this whatever you want)
|---|-manifest.js (Read further to learn what this is) (Required)
|---|-config.js (Read further to learn what this is) (Optional)
|
|-ModulesDirectory (dir) (You can call this whatever you want)
|--|-file1.js (This is where you define your modules)
```
***How To Configure Using A Master Copy For All Projects***

With structureJS you don't have to copy the app code into every project you use it in. Put it in a directory above your projects. The only structureJS specific files you need in each project is a config and manifest file.

You could even create folder above all your projects that holds config and manifest files for each project. This way there is NO structureJS bloat in each project.

What I mean by **master copy** is a single copy of `structureJS.js` somewhere on your server. Make sure all the other required files (structureJSCompress & uglifyjs.min.js) are in the same directory as your master copy.

1. Point `data-config` and `data-manifest` attributes to each files location within a given project **RELATIVE TO THE MASTER COPY**

2. In your project's `config.js` file, set `config.structureJS_base` property to directory containing the master copy **RELATIVE TO THE config.js LOCATION** 

So given the directory structure above, your script tag in `myapp.html` would look like this: 

```html
<script id="structureJS"
    data-manifest="../myAppDirectory/structureJS/manifest"
    data-config="../myAppDirectory/structureJS/config"
    data-uglify-target="*"
    src="../structureJS-master-copy/structureJS.js"/>
```

And `config.js` in `myAppDirectory/structureJS` would look like this:

```javascript
structureJS.configure(
{
  structureJS_base : '../../structureJS-master-copy/',
  module_base : 'Modules/', 
  global_base : 'lib/',
  //...More Config stuff
```

This is certainly not the most user friendly configuration setup but, personally, I think the benefits of having only a single copy of structureJS for all your projects make it worth the time. 

### Importing Files ###

You can tell structureJS to import files using a call to `structureJS.define()` (in manfiset.js), `structureJS.config.commons`, or `structureJS.config.globals`. If the files declared as part of your app contain structureJS modules, whatever those modules expose to other modules  can be accessed inside other modules using the `require` function described later. 

The files you declare for import using `structureJS.config.commons` or `structureJS.config.globals` won't be automatically converted to modules unless they are AMD compliant (like jQuery for example). 

#### Multiple Modules In A Single File ####

This is possible. Be aware that you lose the ability to have the import order automatically resolved by structureJS. Any intra-file dependencies have to be resolved by you by putting the dependencies above their dependents. I would recommend using `structureJS.declareGroup()` to package up mulitple files. Using groups allows you to maintain a flexible dependency structure in development. 


### Configuring Your App ###

Although structureJS comes with default configuration, you can configure the bootstrap process in a config file away from the structureJS source code. To do this put a call to 

`structureJS.configure(Object configSettings [, Object optionsSetting])`

inside the config file you specified in `data-config` attribute of structureJS' `<script>` tag.

**config.js**
```javascript
structureJS.configure(
{
  structureJs_base : 'scripts/structureJs/',    //default: 'structureJS/'
  module_base : 'scripts/structureJs/Modules/', //default: 'Modules/'
  global_base : 'scripts/structureJs/lib/',     //default: 'lib/'
  directory_aliases : {driver : 'drivers/'},    //default: undefined
  commons : ['Util'],                           //default: []
  globals : ['nastyGloablPollution']            //default: []
},
{
  download_minified : false,                    //default: false
  minified_output_tag_id : 'minified'           //default: 'minified'
});
```
`structureJs_base` - Path to where structureJS lives.

`module_base` -  Defualt path to all files your app uses.

`global_base` -  Path to the files you declare in the `globals` config array.

`commons` -  Names of files your app uses. These files or modules are available to all the other modules of you app. Basically declare your utility scripts or modules here. **Can be an empty array.**

`globals` -  Names of files your app will use globally. WARNING: Unless these files contain AMD compliant modules, and variables declared within will pollute the global namespace. In some cases you may be OK with that so I put the option in here to support that. **Can be an empty array.**

`directory_aliases` - Path to other files in your app. See instructions below

`download_minified` - When set to true, structureJS will automatically download the results of minification to a file if your browser will allow it.

`minified_output_tag_id` - In the event that your browser won't let you download your minification results and does not have a console to print them to, you may set this option to the `id` attribute of a `<div>` tag in you HTML and structureJS will print the results there.

#### Directory Aliasing ####

By default structureJS give you two places to put your app's files, `module_base` and `global_base`. You may want to use file from other locations. For example, you may have your driver scripts containing the application logic. These aren't modules so you probably wouldn't want to dump them into the default `Modules/` folder. Say you want to put them in a folder one level above your HTML page in a folder called `drivers/`.

Use the `structureJS.configure(Object configSettings [, Object optionsSetting])` function to configure the alias.
```javascript
structureJS.configure({
 //other config object stuff
 directory_aliases : {driver : '../drivers/'},
 //other config object stuff
});
````

Now when you declare the file in your manifest you could put `driver` in front of the filename instead of `../drivers/` like so: 

`structureJS.module('driver/MyDriver');`

Now you can change the location of your drivers once in the config object and all your imports will still work. Or you can use the aliases to add semantic meaning to the import of files liek we did by using the word 'driver' before our module.

Another great use of aliasing is it allows you to keep your module collection outside of any one project but make use of them from any project.

For example, you could keep your module collection somewhere on your server and alias your module collection directory to access them.

```javascript
structureJS.configure({
 //other config object stuff
 directory_aliases : {mod-lib : '../../module_repo/'},
 //other config object stuff
});
```

**NOTE:** All paths are relative to the location of HTML file the structureJS script tag.
**NOTE:** 'remote' is a reserved alias pointing to the structureJS module repo. See more about this below

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
The idea behind the manifest file is it provides a central place that you can go to manage the structure of your app. It doesn't matter what order you declare the modules in, structureJS will handle the dependency resolution and make sure files are imported in the order required for everything to work.

All files have to be declare in their own call to `declare`. If you name something as a dependency that hasn't been declared structureJS will cry and not load.

Note that what we are declaring here are file names, not modules. A single file can have as many modules as you want. That being said, if there dependencies between modules within a single file you must order your modules so that dependencies are at the top.

NOTE: `file1` cannot depend on `file2` while `file2` depends on `file1`. This is called a **circular dependency** and structureJS currently does not support this design pattern.

#### Using Groups ####

Suppose you have custom database API modules for MongoDB and IndexedDB. Your app will need to use all of them and you want to wrap the two modules together in a 3rd module that manages the state of the first two. 

Copying and pasting the names of the three modules every where they are depended on would quickly become tedious. Furthermore, suppose you added a 4th file to the mix? Your project could quickly become unruly.

**manifest.js**
```javascript
structureJS.declareGroup({
    name : 'DB', 
    description : 'API for client-side DB functions'
  });

structureJS.DB.declare('IdbClient');
structureJS.DB.declare('MongoDB');
structureJS.DB.declare('DBClient',['IdbClient','MongoDB']);
```

Using the above code in your manifest you have created a **logical group** out of 3 separate files. 

Notice that `IdbClient` and `MongoDB` call `declare()` on top of an object called `DB`. Whenever you declare a group, that group gets it's own namespace which you add components to by calling `declare()` on the group's namespace.

Now use the group name `DB` as a dependency to other modules or even other groups. Like so: 

**manifest.js**
```javascript
//other declarations
structureJS.declare('main-app-driver', ['DB']);
//other declarations
```

If the structure of that group changes, the change will be reflected anywhere that group is referenced.

Each group can have it's own dependency chain which will be automatically resolved before the group is inserted into any other dependency chain.

It's called a logical group because the 3 files remain separate and the group only exists as a concept.

**Turning Logical Groups Into Physical Ones**

Using the same database example as above, let's suppose this group of files has worked really well in a couple projects but having to copy and paste the group declaration into every project is getting tedious. structureJS allows you to combine and minify a logical group into a single file using only your browser.

To do this you would make the following change to your structureJS `<script>` tag:

```html
<script id="structureJS"
    data-manifest="manifest"
    data-config="config"
    data-uglify-target="DB"     
    src="structureJS/structureJS.js"/>
```

When you run the html page containing the above tag, structureJS will perform the combination and then output the results in a number of different ways. There's more on minification below.

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

For example, if you have declared that your app will use jQuery (which is AMD compliant) you would use it in a module like this:

**file1.js**
```javascript
structureJS.module('module1', function(require){
    var $ = require('jquery');
    //rest of you module
});
```

**NOTE:** Currently, any imports declared using `structureJS.module()` must return a value. If your module doesn't need to to return anything to be used by other parts of you app, then you should probably not use a module. See **Using Require Function In Non-Modules** for info on how to utilize modules in non-module files.

### Using Remote Modules From The structureJS Community ###

One of my visions for this project is to provide an easy way for Javascript developers to share their code with others. For example, what if you write a super kick-ass module to make any web app responsive to screen size? You have successfully used this module in a number of your projects and think other could benefit from it as well.

On the flip side,  say there's another person who is just starting out developing and they have to make a web site they're working on responsive. Wouldn't it be neat if they could go to modules.structureJS.com and browse responsive design modules? Let's say the module on modules.strucureJS.com was called **responsive.js**. To utilize the module in thier project they would declare the remote module intheir manifest like so:

**manifest.js**
```javascript
structureJS.declare('remote/responsive');
```

The directory alias `remote` is a reserved alias that points to the structureJS module repo that you or anyone else can contribute to or use. 

### Modules & Non-AMD Global Dependencies ###

You module may require the existence of a script that you can only access through its variable in the global namespace. This is needed because structureJS is designed to let you use other's modules easily. However it would not be very efficient for a module creator to package the module with a large library.

```javascript
structureJS.module({
  name : 'Encrypt',
  type : 'DOM Manipulator',
  description : 'Encrypt data using RSA',
  global_dependencies : ['JSEncrypt']
  }, function(require){
    //module code here
    return {};
});  
```

The above module definition states that `Encrypt` requires that the `JSEncrypt` variable be available in the global namespace. structureJS will check for the existence of `JSEncrypt` when it loads the module and will throw an error if the variable does not exist.

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

### Using Require Function In Non-Modules ###

Remember structureJS is not just about creating modules. In fact you could use structureJS and never use a module. You could use it to synchronize your script load order and never touch the module functionality. 

If your main processing logic won't have potential re-usability then it really doesn't make sense to put it in a module. But you still want access to all those sweet modules your main script depends on, right?

structureJS let's you use the `structureJS.require` function. This is just an alias of the `require` function you use inside of modules so it works exactly the same way. 

### Minification Using Just Your Browser ###

structureJS uses the awesome work of UglifyJS to let you combine, compress, and mangle your app into a single file. structureJS will combine your files in the correct order. Currently, to download the compressed file you must have an HTML5 compliant browser. structureJS also gives you the option to display the out in a `<div>` tag, in the console, or have it open up as a pop up window.

To minify your project simply set the `data-uglify-target` atrribute to a file name, group name, or a comma separated list comprised of files and/or groups. 

```html
<script id="structureJS"
    data-manifest="structureJS/manifest"
    data-config="structureJS/config"
    data-uglify-target="group_name1, filename2"
    src="structureJS/structureJS.js"/>
```

**NOTE:** For Chrome extensions, you will need to add `unsafe-eval` option to your content security policy object in your manifest. UglifyJS needs to use eval to work. Since minification doesn't need to be done in production you can simply remove this permission during deployment.

`"content_security_policy": "script-src 'self' 'unsafe-eval' ; object-src 'self'"`

See: https://developer.chrome.com/extensions/contentSecurityPolicy

### Group Export ###

You can turn a logical group into a single, physical file using the `data-uglify-target` option. The default action is combine and minify the group but you may have structureJS do a combination only by setting the `-u` flag after a group or file name in a `data-uglify-target` list. See the exaple below.

```html
<script id="structureJS"
    data-manifest="structureJS/manifest"
    data-config="structureJS/config"
    data-uglify-target="group_name1 -u, filename2"
    src="structureJS/structureJS.js"/>
```

### Creating A Deployment Version ###

You would never want to have structureJS, or any module loader, dynamically importing 10 different Javascript files everytime someone visited you web site. This would create lots of separate http requests and degrade app/site performance. The ideal is to have your entire app to be combined and minified into a single file that is loaded with a single http request.

You can easily create a combined and minified version of you app for deployment using structureJS and only your browser. To do this simply set the value of the `data-uglify-target` option to '*' like below.

```html
<script id="structureJS"
    data-manifest="structureJS/manifest"
    data-config="structureJS/config"
    data-uglify-target="*"
    src="structureJS/structureJS.js"/>
```

Save the results to a file called `myapp-production.js`. Now to deploy the app you put a single script tag like so:

```html
<script src="myapp-production.js"/>
```

Like I said above, structureJS is a development tool. Most of the logic contained is only of use in development. So when you are exporting your entire app, structreJS is smart enough to remove about 90% of itself from the minified version it packages with your deployment version. This results in structureJS haveing a total deployment size of aroun 3kB.

### AMD Compliance ###

Currently structureJS is partially AMD compliant. JQuery is the only AMD compliant library I have tested it with. That being said, hopefully I can get some help from the community to bring structureJS into full compliance.
