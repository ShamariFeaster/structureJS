var structureJS = (typeof structureJS != 'undefined') ? structureJS : {

  options : {
    download_minified : false,
    minified_output_tag_id : 'minified',
    log_priority : 3
  },
  
  /*@StartDeploymentRemove*/
  config : {
    structureJS_base : 'structureJS/',
    module_base : 'Modules/',
    global_base : 'lib/',
    globals : [],//things like jQuery ie, we are ok with the script polluting global ns
    commons : []/*sandboxed modules that r available to all other modules via require()
                  these should have no external dependencies. If it has dependencies
                  declare it normally or put dependencies into single file. This is going
                  to be for utilities modules and the like. Do not declare common files in
                  your manifest as it will cause unindended problems with dependency resolution
                */
    },
    uglifyMode : false,
    compressedMode : false,
    hasRemotes : false,
    exportFiles : '',
    uglifyFiles : '',
    /*@InsertAfterRemotes*/
  //GENERIC ENVIRNMENT
  _needTree : {},
  _files : [],
  _exportOrder : [],
  _groupNames: [],
  _groupsRDeps : {},
  //Constants
  NAME : 'structureJS',
  UGLYFY_FILENAME : 'uglifyjs.min',
  COMPRESSION_FILENAME : 'structureJSCompress',
  EXPORT_FILENAME : 'structureJSexport',
  REMOTE_KEYWORD : 'remote',
  REMOTE_URL : 'http://deeperhistory.info/structureJS/',
  /*@EndDeploymentRemove*/
  
  
  _modules : {},
  _cache : {},
  /*interface to store data on structureJS*/
  cache : function(key, value){
    var returnVal = null;
    if(arguments.length == 1 && this._cache[key])
      returnVal = this._cache[key];
    if(arguments.length == 2 && key && value)  
      this._cache[key] = value
    return returnVal;
  },
  /*structureJS Utilities*/
  extend : function(target, src){
    if(typeof target !== 'object' || typeof src !== 'object')
      throw 'Error: extend param is not an an oject';
    for(var prop in src){
      target[prop] = src[prop];
    }
  },

  pLog : function(priority, msg, arrayOrObj){
    if(priority <= this.options.log_priority){
      console.log(msg);
      if(typeof arrayOrObj != 'undefined'){
        console.log(arrayOrObj);
      }
    }
  },
  /*NOTE: arguments is not of type array hence the wierd call to splice()*/
  printf : function(/*has arguments passed in via apply()*/){
    var returnVal = '';
    if(arguments.length > 1){
      var args = null;
      var result = '';
      var argIndex = 0;
      
      var formattedString = arguments[0];
      args = Array.prototype.slice.call(arguments, 0);
      args = args.splice(1, (arguments.length - 1));
      returnVal += formattedString.replace(/%s/g, function(match, matchOffset, fullString){
        if(argIndex < args.length){
          return args[argIndex++];
        }else{
          return '%s';
        }
      });
    } 

    return returnVal;
  },
  pLogf : function(){
    var returnVal = '';
    var _this = this;
    //priority = arguments[0];
    if(arguments.length >= 2 && arguments[0] <= this.options.log_priority){
      console.log(_this.printf.apply(null, Array.prototype.slice.call(arguments, 1)));
    }
  },
  
  
  
  /*@StartDeploymentRemove*/
  /*Internals*/
  getFilename : function(input){
    var fileName = '';
    if( input && typeof input === 'object' )
      fileName = Object.keys(input)[0];
    else if(typeof input === 'string')
      fileName = input;
    return fileName;
  },
  printOrder : function(msg, modules, priority){
    var priority = (typeof priority == 'undefined') ? 1 : priority;
    var output = msg || '';
    for(var i = 0; i < modules.length; i++){
      output += this.getFilename( modules[i] ) + ', ';
    }
    this.pLog(priority,output);
  },
  resolveFilePath : function(input){
    var _this = this;
    var remoteRegex = new RegExp('^' +_this.REMOTE_KEYWORD + '\/', 'i');
    var cdnRegex = /^(http|\/\/)/;
    if(typeof input == 'undefined')
      return '';
    var config = this.config;
    
    /*NOTE: inside inner functions this refers to window*/
    function resolveDirectoryAliases(input, defaultBase){
      var aliases = config.directory_aliases;
      var results = '';
      console.log(input + ' is CDN: ' +cdnRegex.test(input));
      /*Before returning replace 'remote' with remote URL*/
      if(new RegExp(remoteRegex).test(input)){
        results = input.replace(remoteRegex, _this.REMOTE_URL) + '.js';
        _this.hasRemotes = true;
      }else if(cdnRegex.test(input)){
        results = input + '.js';
        _this.hasRemotes = true;
      }else{
        results = defaultBase + input + '.js';
      }
        
      var matchResult = null;  
      var regex = null;
      for(var alias in aliases){
        //checkl for reserved 'remote' alias
        if(new RegExp(_this.REMOTE_KEYWORD, 'i').test(alias))
          throw 'Alias "remote" is reserved. Please rename';
        
        regex = new RegExp('^' + alias + '\/', 'i');
        matchResult = regex.exec(input);
        
        if(matchResult != null){
          results = input.replace(matchResult[0], aliases[alias]) + '.js';
        }
      }
      return results;
    }
    
    var filePath = '';
    if( input && typeof input === 'object' )
      filePath = resolveDirectoryAliases(Object.keys(input)[0], config.module_base);//config.module_base + Object.keys(input)[0] + '.js';
    else if(input == this.UGLYFY_FILENAME || input == this.COMPRESSION_FILENAME
                                          || input == this.EXPORT_FILENAME)
      filePath = resolveDirectoryAliases(input, config.structureJS_base);//config.structureJS_base + input + '.js';
    else if(typeof input === 'string')
      filePath = resolveDirectoryAliases(input, config.global_base)//config.global_base + input + '.js';
    
    return filePath;
  },
  loadScript : function(url, callback){
    this.pLog(1,'Loading: ' + url);
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      
      head.appendChild(script);
      script.onload = callback;
    },

  loadModules : function(config){
    var _this = this;
    var globals = _this.config.globals || [];
    var commons = _this.config.commons || [];
    var deploymentTasksRemaining = false;
    /*Wrap commons and push onto front of modules*/
    for(var i = commons.length - 1; i >= 0; i--){
      var obj = {}; obj[commons[i]] = null;
      _this._files.unshift(obj);
    }
    /*put uglifyjs at front of globals if uglify mode*/
    if(_this.uglifyFiles != '') {
      globals.unshift('uglifyjs.min');
    }
    
    /*Put globals at the front of the line.
    Have to deep copy export order because we consume
    it here. Shallow leaves us with empty exports*/
    _this._files = globals.concat(_this._files);
    for(var i = 0; i < _this._files.length; i++){
      _this._exportOrder.push(_this.resolveFilePath( _this._files[i] ));
    }
    
    //recursive callback
    var callback = function(){
      var filePath = _this.resolveFilePath( _this._files.shift() );
      /*Still files to load up*/
      if(filePath){
        _this.loadScript(filePath, callback);
      }else{
        
      /*No more files, check for deployment tasks*/  
        if( (_this.exportFiles != '' || _this.uglifyFiles != '')
                                     && !deploymentTasksRemaining){
        
          if(_this.exportFiles != '')
            _this._files.unshift(_this.EXPORT_FILENAME);
          if(_this.uglifyFiles != '')
            _this._files.unshift(_this.COMPRESSION_FILENAME);
            
          deploymentTasksRemaining = true;
        }

        
        /*If there are deployment tasks keep loading if not show completion msg
          NOTE: Not working because deploymentTasksRemaining is used to stop infinte 
          looping and cannot be set back to false, meaning if we had deployment tasks
          we never get to the else in this statement
        */
        if(deploymentTasksRemaining)
          _this.loadScript(_this.resolveFilePath(_this._files.shift()), callback);
        else
          _this.pLog(1,'Bootstrap Complete. Thanks For Using structureJS.');
      }
    }
    _this.pLog(3,'This Files Before Loading: ',_this._files);
    _this.loadScript( this.resolveFilePath( _this._files.shift() ) , callback );
    
  },
  /*I'm thinking I want to keep this process iterative because it will be kinder to
  memory than a recursive solution if the project is sufficently large. Note: we do
  not detect duplicate declaration - again no baby sitting at the expense of 
  maintainability.
  TODO:  cleanup variable names WTF is modName2????? 
  */
  detectCircularDependency : function(needTree){
    var _thisDeps = null;
    var modName1 = '';
    var modName2 = '';
    var modName3 = '';
    for(var modName1 in needTree){//for every module
     this.pLog(2,'Checking '+modName1+'\'s dependencies');
     
      for(var i1 = 0;i1 < needTree[modName1].length; i1++){//go through it's depenedencies
        modName2 = needTree[modName1][i1];
        this.pLog(2,'Dependency '+i1+' of '+modName1+' is '+ modName2);
        /*Check if declared groups are dependencies. If they aren't then I need to
        remove them from TLC. Removal happens in orderImports()*/
        if(this._groupNames.indexOf(modName2) > -1){
          this._groupsRDeps[modName2] = 1;
        }
        if(typeof needTree[modName2] !== 'undefined'){//my dependency list
          for(var i2 = 0;i2 < needTree[modName2].length; i2++){//make sure module isn't a dependency of its own dependency
            modName3 = needTree[modName2][i2];
            this.pLog(2,'Checking '+modName2+'\'s dependencies for circular reference to parent '+modName1 );
            if(modName1 == modName3){
              throw 'ERROR: CIRCULAR DEPENDENCY: ' + modName1 + ' is a dependency of its own dependency ' + modName2;
            }
          }
        }else{
          throw 'ERROR: ' + modName2 + ' is a dependency of ' + modName1 + ' but has not been explicitly declared.';
        }
      
      }
      
    }
 
    return false;
  },
  /*This function converts our needTree into an array. The array structure is
  used through out because it is sortable. This function does the dependency
  sorting*/
  orderImports : function(needTree){
    this.detectCircularDependency(needTree);
    var _this = this;
    var groupsRDeps = this._groupsRDeps;
    var modules = [];
    
    //convert needTree to array for easier processing
    for(var fileName in needTree){
      var modObj = {};
      modObj[fileName] = needTree[fileName];

      /*If you are a group, you have to be listed as a declared
      dependencies to remain in TLC*/
      if(this._groupNames.indexOf(fileName) > -1){
        for(var groupName in groupsRDeps){
          if(fileName == groupName)
            modules.push( modObj );
        }
      }else{
        /*If you aren't a group you get place on TLC no matter what*/
        modules.push( modObj );
      }
    }

    /*INTERNAL FUNCTIONS
     NOTE: 'this' refers to window inside these functions*/
    function getModName(modObj){
      return _this.getFilename(modObj);
    }

    this.printOrder('OrderImports: Starting Order: ', modules);
    
    function getModDeps(modName){
      return needTree[modName];
    }
    function getIndex(modName){
      for(var i = 0; i < modules.length; i++){
        if( modName === getModName( modules[i] ) )
          return i;
      }
    }
    
    function getModObj(modName){
      for(var i = 0; i < modules.length; i++){
        if( modName === getModName( modules[i] ) )
          return modules[i];
      }
    }
    
    function insertBefore(obj, targetIndex){
      var objIndex = getIndex( getModName(obj) );
      var targetObj = getModObj( getModName(modules[targetIndex]) );
      var targetName = getModName(modules[targetIndex]);
      _this.pLog(2,'Moving ' + getModName(obj) + '('+objIndex+') in front of ' + targetName + '('+targetIndex+')');
      var resultArr = [];
      for(var i = 0; i <= modules.length; i++){
        if(i < targetIndex && _this.getFilename(modules[i]) != _this.getFilename(obj)){
          _this.pLog(3,' < pushing : ' + _this.getFilename(modules[i]) + ' @ index ' + i);
          resultArr.push(modules[i]);
        }else if(i == targetIndex ){
          _this.pLog(3,'== pushing : ' + _this.getFilename(obj) + ' @ index ' + i);
          resultArr.push(obj);
        }else if(i > targetIndex && _this.getFilename(modules[i-1]) != _this.getFilename(obj)){
          _this.pLog(3,' > pushing : ' + _this.getFilename(modules[i-1]) + ' @ index ' + i);
          resultArr.push(modules[i-1]);
        }
      }
      modules = resultArr;
    } 
    /*END INTERNAL FUNCTIONS*/
    
    var parentIndex = 0;
    var parentName = '';
    var parentDeps = null;
    var childName = '';
    var insertPerformed = false;
    for(var i1 = 0; i1 < modules.length; i1++){
      if(insertPerformed){//have to reset at top or esle we can never set i back to 0
        i1 = ( (i1 - 2) > -1)? i1-2 : 0;//don't let i1 go negative
        insertPerformed = false;
      }
      parentName = getModName(modules[i1]);
      parentIndex = getIndex(parentName);
      parentDeps = getModDeps(parentName);
      this.pLog(3,'Resolving: '+parentName+', Index: ' + i1);
      for(var i = 0; i < parentDeps.length; i++){
        childName = parentDeps[i];
        if(parentName === childName)
          continue;
        /*If we push dependencies in front of ourself then we need to
        set index back to make sure we run resolution on my deps or else
        we won't ever resolve my deps*/  
        if( getIndex(childName) > parentIndex){
          insertBefore( getModObj(childName), getIndex(parentName));
          insertPerformed = true;
        }
      }
    }
    this.printOrder('OrderImports: Ending Order: ', modules);
    return modules;
  },
  dereferenceGroups : function(files){
    var fileName = '';
    var removeFileName = '';
    var beforeInsert = null;
    var afterInsert = null;
    var resultArray = null;
    var groupComponents = null;
  
    /*Resolve group chains and splice results into TLC*/
    for(var i = 0; i < files.length; i++){
      fileName = this.getFilename(files[i]);
      
      //We found a reference to a soft group in top-level chain (TLC)
      if( this._groupNames.indexOf(fileName) > -1) {

        this.pLog(3,'\nResolving Group ' + fileName + ' Refernce');
        groupComponents = this[fileName]._needTree;
        /*Remove Group Refs*/
        for(var component in groupComponents){
          
          for(var i2 = 0; i2 < files.length; i2++){
            removeFileName = this.getFilename(files[i2]);

            if(removeFileName == component){
              this.pLog(3,'Group: '+fileName+', removing: ' + removeFileName);
              files.splice(i2, 1);
            } 
          }        
        }
        /*this[fileName] is group object. we put it as prop of structureJS*/
        this.printOrder('Files: ',files,3);
        resolvedGroup = this.orderImports(this[fileName]._needTree);
  
        beforeInsert = files.slice(0,(i>0)? i : 0);
        this.printOrder('Before Insert: ',beforeInsert,3);
        
        afterInsert = files.slice(((i+1)<files.length)?(i+1) : files.length, files.length);
        this.printOrder('After Insert: ',afterInsert,3);

        resultArray = beforeInsert.concat(resolvedGroup);
        this.printOrder('Before Insert +  Resolved: ',resultArray,3);

        resultArray = resultArray.concat(afterInsert);
        
        this.printOrder('Final Result: ',resultArray,3);
        
        files = resultArray;
        /*b/c we removed group name the array was shifted to the left by one
        we decremenet i to compensate and make sure we don't miss resolving our
        neighbor to the right*/
        --i;
      }
    }
    return files;
  },
  /**/
  resolveDependencies : function(){
    this._files = this.dereferenceGroups( this.orderImports(this._needTree) );
    this.printOrder('Resolved Order: ', this._files);
    this.loadModules(this.config);
  },
  loadConfigAndManifest : function(onLoaded){
  
    var structureTag = document.getElementById('structureJS');//returns null if not found
    if(typeof structureTag === 'undefined' || structureTag === null)
      throw 'ERROR: No script tag with ID of "structureJS" which is required';

    var config = structureTag.getAttribute('data-config');
    var manifest = structureTag.getAttribute('data-manifest');
    var uglify = structureTag.getAttribute('data-uglify');
    var uglifyFiles = structureTag.getAttribute('data-uglify-target');
    var exportFiles = structureTag.getAttribute('data-export-softgroup');
    var structreJSBase = this.config.structureJS_base;
    if(typeof manifest === 'undefined' || manifest === '' || manifest === null)
      throw 'ERROR: No manifest declared';
      
    if( (typeof uglify === 'undefined' || uglify !== null) && /true/i.test(uglify) == true)
      this.uglifyMode = true;
    //data-export-softgroup
    if( exportFiles !== null){
      this.exportFiles = exportFiles;
    }
    
    if( uglifyFiles !== null){
      this.uglifyFiles = uglifyFiles;
    }
    
    var _this = this;
    //recursive callback
    var callback = function(){
      if(manifest != null){
        _this.pLog(1,'Loading Manifest: ' + manifest );
        _this.loadScript(manifest + '.js', callback);
        manifest = null;
      }else{
        _this.pLog(1,'Done Loading Manifest And/Or Config Files.');
        onLoaded.call(_this);
      }
    }
    if(config){
      this.pLog(1,'Loading Config: ' + config );
      this.loadScript( config + '.js', callback );
    }else{
      this.loadScript(  manifest + '.js', function(){
        onLoaded.call(_this);
      } );
    }
  },
  /*Prototype for wrapping tlc components in class for cleaner semantics
    and less use of Object.keys(input)[0] for getting names*/
  tlcObj : function(name, deps){
    var _this = {};
    _this.name = name;
    _this.deps = deps || [];
    return _this;
  },
  _tlc : function(name, dep){
    return new this.tlcObj(name, dep);
  },
  /*@EndDeploymentRemove*/
  
  
  
  decodeInfoObj : function(infoObj){
    var results = {name : ''};
    if(typeof infoObj === 'string')
      results.name = infoObj;
    else if(typeof infoObj === 'object'){
      if(typeof infoObj.name == 'undefined')
        throw 'Configuration Object Must Have Name Property';
      else
        this.extend(results, infoObj);
    }
    return results;
  },
  
  
  
  
  /*@StartDeploymentRemove*/
  declare : function(name, dependencies){
    /*Add error checking here for name*/
    if(typeof dependencies == 'undefined')
      dependencies = [];
    this._needTree[name] = dependencies;
    
  },
  declareGroup : function(groupInfo){
    var _this = this;
    var infoObj = this.decodeInfoObj(groupInfo);
    this._groupNames.push(infoObj.name);
    this.declare(infoObj.name);
    this[infoObj.name] = {};
    var groupNamespace = this[infoObj.name];//make structureJS.<group name> to declare files on
    groupNamespace['_needTree'] = {};
    /*Copying functions TODO: do this prototypically*/
    groupNamespace.declare = function(name, dependencies){
      /*uses declare to put dependeny tree together on <group name>._needTree
      we would resolve this separately to construct hard group*/
      _this.declare.apply(groupNamespace, [name, dependencies]);
      /*I don't want to add to TLC because unless user puts group in TLC*/
      //_this.declare(name, dependencies);
    };
  },
  /*@EndDeploymentRemove*/
  
  
  
  /*
    the idea behind the 'amd' and '_call' aliases of require function
    is that it allows user to put semantic meaning into their requires.
    _class being reserved for modules that have constructors. The config object
    allows users to set a type. This is again purely for semantics. if the module 
    is to be used in a specific design pattern, subject/observer for example, the 
    module writter can document the module's role inside the code.
  */
  module : function(modConfig, /*function*/ executeModule){
    if(typeof modConfig == 'undefined' || typeof modConfig === 'function')
      throw 'Module Must Have Configuration Object Or Name String';
    if(typeof executeModule !== 'function')
      throw 'Module Must Have A Function As It\'s Definition';
      
    var _this = this;
    var infoObj = null;
    var moduleWrapper = {type : 'unknown'};
    var globDeps = null;
    infoObj = this.decodeInfoObj(modConfig);
    /*Check if declared global deps is in global namespace*/
    if(typeof infoObj.global_dependencies != 'undefined'){
      globDeps = infoObj.global_dependencies;
      if(!Array.isArray(globDeps)){
        throw 'ERROR: global_dependencies Property Of ' + infoObj.name + '\s Configuration Object Must Be An Array.'
      }
      
      for(var i = 0; i < globDeps.length; i++){
        if(typeof window[globDeps[i]] == 'undefined')
          throw 'ERROR: ' + infoObj.name + ' Requires ' + globDeps[i] + ' To Be In Global Namespace.';
      }
    }
    function require(depName){
      var retVal = null;
      if( _this._modules[depName] )
        retVal = _this._modules[depName]['module'];
      return retVal;
    };
    /*aliases that let user's add semantic meaning to thier require calls*/
    require.amd = require;
    require.getType = function(modName){
      var retVal = null;
      if( _this._modules[depName] )
        retVal = _this._modules[depName]['type'];
      return retVal;
    }
    require._class = require;
    structureJS.require = require;
    

    /*Put the return val of the module function into modules object
    so they can be retrieved later using 'require'*/
    moduleWrapper['module'] = executeModule.call(this, require); 
    if(typeof moduleWrapper['module'] == 'undefined')
      throw infoObj.name + ' FAILED: Module Function Definition Must Return Something';
    
    this._modules[infoObj.name] = moduleWrapper;
  },
  
  /*I split this up because I want the module importation via require to be transparent
  to the user. so require will correctly get any type of module*/
  moduleAMD : function(modName, executeModule){
    var moduleWrapper = {type : 'amd', name : modName};
    moduleWrapper['module'] = executeModule.call(null).call(null);
    if(typeof moduleWrapper['module'] == 'undefined')
      throw 'Module Function Definition Must Return Something';
    this.pLog(2,'AMD: Loading ' + modName);
    this._modules[modName] = moduleWrapper;
  }
  
  
  
  /*@StartDeploymentRemove*/,
  /*This is for hard groups*/
  group : function(groupConfig, /*function*/ groupModule){
    if(typeof groupConfig == 'undefined' || typeof groupConfig === 'function')
      throw 'Group Must Have Configuration Object Or Name String';
    if(typeof groupModule !== 'function')
      throw 'Group Must Have A Function As It\'s Definition';
    /*Doesn't return anything, simply executes modules inside the group*/
    executeModule.call(null, this.decodeInfoObj(groupConfig) ); 

  },
  
  configure : function(configObj, optionsObj){
    var config = this.config;
    var options = this.options;
    this.extend(config, configObj);
    this.extend(options, optionsObj);
  }
  /*@EndDeploymentRemove*/
};

(function(window){
  
  /*if there is no console or I have turned it off, kill log function*/
  if ( ! window.console || structureJS.options.log == false) 
    window.console = { log: function(){}, logf : function(){} };
  /*Init*/

  /*Trying to support AMD for jQuery. Total AMD compliance to come later.
    Becoming AMD compliant is going to require a lot of thought so that's something
    I think is best done by a community after open sourcing.
  see: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
       http://addyosmani.com/writing-modular-js/*/
  window.define = function(id, deps, factory){
    window.structureJS.moduleAMD(id, factory);
  };
  window.define.amd = {jQuery : true};
  
  /*@StartDeploymentRemove*/
  /*Sanity Check*/
  var structureTag = document.getElementById('structureJS');//returns null if not found
  if(typeof structureTag === 'undefined' || structureTag === null)
    throw 'ERROR: No script tag with ID of "structureJS" which is required';
  structureJS.loadConfigAndManifest(structureJS.resolveDependencies);
  /*@EndDeploymentRemove*/
})(window);
