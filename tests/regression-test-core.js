window.onload = function(){
/* Style Guidelines:
  COL_MAX = 100 columns 
  if over COL_MAX multi-line function args or string
  
  Multi-line function agrs:
  new args should start with ',' to visually indicate a function arg
  add newline between mutil-lines and next statement
  
  if <= 2 lines
  comma aligns with opening parenthesis of function call
  
  if > 2 lines
  move all args below the function call and indent the args like a block
  
  callbacks as args:
  indent one level from the comma alignment
  
  Definitions:
    i|in - is and is not
*/
QUnit.asyncTest( 'structureJS.loadScript', function( assert ) {
  expect( 1 );
  
  structureJS.loadScript(
    'dummy-script.js'
    , function(){
        assert.ok( window.scriptLoaded, "structureJS.loadScript is working." );
        QUnit.start();
      }
    , 'dummy-script'
  );

});

QUnit.test('structureJS.extend',function( assert ){
  var source = {scalarClober : '2', array : [1,2,3], 
                obj : {aClober : 'b', addition : 1}, addition : 'new'},
      
      target = {scalarClober : '1', array : [4,5,6], 
                obj : {aClober : 'a'}},
                          
      expectedResultTarget = {scalarClober : '2', array : [4,5,6,1,2,3], 
                                obj : {aClober : 'b', addition : 1}, addition : 'new'},
                                
      expectedResultTargetCopy = {scalarClober : '2', array : [1,2,3,4,5,6], 
                                obj : {aClober : 'b', addition : 1}, addition : 'new'},
                                
      targetCopy = {scalarClober : '1', array : [4,5,6], 
                obj : {aClober : 'a'}},
      notAnObject = 1;
                
  structureJS.extend(target, source);
  assert.deepEqual(target, expectedResultTarget
                  , 'structureJS.extend - unshiftArray is undefined');
  
  structureJS.extend(targetCopy, source, true);
  assert.deepEqual(targetCopy
                  , expectedResultTargetCopy, 'structureJS.extend - unshiftArray is true');
  
  try{
    structureJS.extend(notAnObject, source, true);
  }catch(e){
    assert.ok(true, 'Non object passed. Error correctly thrown: ERROR: ' + e);
  }
});

function getMockStructureJS(extensionObjects){
  
  var MockStructureJS = {
    options : {
      download_minified : false,
      minified_output_tag_id : 'minified',
      log_priority : 3
    },

    config : {
      core_base : '',
      core_lib_folder : 'lib/',
      project_base : '', 
      manifest_name : 'manifest/core-manifest',
      config_name : 'config/config',
      bootstrap_base : null,
      bootstrap_config : null,
      directory_aliases : {export_bootstrap : '../../structureJS/Bootstraps/'},
      globals : [],
      commons : []
      },

    flags : {
      hasRemotes : false,
      exportInitiated : false,
    },

    state : {
      dependencyTree : {}, 
      resolvedFileList : [],
      pmiFileOrder : [],
      declaredGroups: [],
      groupsInTLC : {},
      pmiFilesSelectedForExport : '',    
      modules : {},
      cache : { structureJSTag : null } 
    },

    NAME : 'structureJS-core',
    UGLYFY_FILENAME : 'uglifyjs.min',
    EXPORT_CONFIG_FILENAME : 'export-config',
    REMOTE_KEYWORD : 'remote',
    REMOTE_URL : 'https://google.com/'
  };
  if(typeof extensionObjects == 'undefined')
    extensionObjects = {};
  if(typeof extensionObjects.options == 'undefined')
    extensionObjects.options = {};
  if(typeof extensionObjects.config == 'undefined')
    extensionObjects.config = {};
  if(typeof extensionObjects.flags == 'undefined')
    extensionObjects.flagsObj = {};
  if(typeof extensionObjects.state == 'undefined')
    extensionObjects.stateObj = {};
  if(typeof extensionObjects.functionDependencies == 'undefined')
    extensionObjects.functionDependencies = {};
  
  structureJS.extend(MockStructureJS.options, extensionObjects.options );
  structureJS.extend(MockStructureJS.config, extensionObjects.config);
  structureJS.extend(MockStructureJS.flags, extensionObjects.flags );
  structureJS.extend(MockStructureJS.state, extensionObjects.state);
  structureJS.extend(MockStructureJS, extensionObjects.functionDependencies);
  return MockStructureJS;
}

QUnit.test('structureJS.resetCoreState',function( assert ){
  var MockStructureJS = getMockStructureJS(
  {
    state : {
      dependencyTree : {blah : 'a'},
      resolvedFileList : [1,2,3],
      pmiFileOrder : [1,2,3],
      declaredGroups : [1,2,3],
      groupsInTLC : {blah : 'b'}
      },
    config : {
      globals : [1,2,3],
      commons : [1,2,3]
    }
  
  });
  structureJS.resetCoreState.call(MockStructureJS);
  assert.deepEqual(MockStructureJS.state['dependencyTree'], {}
                  , "structureJS.state['dependencyTree'] = {}");
                  
  assert.deepEqual(MockStructureJS.state['resolvedFileList'], []
                  , "structureJS.state['resolvedFileList'] = []");
                  
  assert.deepEqual(MockStructureJS.state['pmiFileOrder'], []
                  , "structureJS.state['pmiFileOrder'] = []");
                  
  assert.deepEqual(MockStructureJS.state['declaredGroups'], [] 
                  , "structureJS.state['declaredGroups'] = []");
                  
  assert.deepEqual(MockStructureJS.state['groupsInTLC'], {}
                  , "structureJS.state['groupsInTLC'] = {}");
                  
  assert.deepEqual(MockStructureJS.config.globals.length, 0
                  , "structureJS.config.globals.length = 0");
                  
  assert.deepEqual(MockStructureJS.config.commons.length, 0
                  , "structureJS.config.commons.length = 0");
  
});


QUnit.test('structureJS.resolveDirectoryAliases',function( assert ){
  var mockStructureJS = getMockStructureJS();
  
  /*----Setup
  case : remote discovery flags side effect with remote keyword
  */
  var remoteKeywordReplaced = structureJS.resolveDirectoryAliases.call(
                                mockStructureJS
                                , mockStructureJS.REMOTE_KEYWORD + '/test'
                                , 'shouldNotBeApplied'
                              );
                              
  /*Assertion*/
  assert.ok(mockStructureJS.flags['hasRemotes']
            , "mockStructureJS.flags['hasRemotes'] set true on remote keyword.");
  
  /*----Setup
  case : remote discovery flags side effect with remote keyword
  */
  mockStructureJS.flags['hasRemotes'] = false;
  /*Assertion*/
  assert.equal(
    remoteKeywordReplaced, 
     mockStructureJS.REMOTE_URL + 'test.js'
    , "remote keyword correctly replaced by configured URL." 
  );
  
  /*----Setup
  case : remote discovery flags side effect with http | // protocol
  */
  structureJS.resolveDirectoryAliases.call(
    mockStructureJS
    , 'http://test'
    , 'shouldNotBeApplied'
  );
  
  /*Assertion*/
  assert.ok(mockStructureJS.flags['hasRemotes']
            , "mockStructureJS.flags['hasRemotes'] set true on http:// protocol found in file path");
  
  /*----Setup*/
  mockStructureJS.flags['hasRemotes'] = false;
  
  structureJS.resolveDirectoryAliases.call(
    mockStructureJS
    , '//test'
    , 'shouldNotBeApplied'
  );
  
  /*Assertion*/
  assert.ok(mockStructureJS.flags['hasRemotes']
            , "mockStructureJS.flags['hasRemotes'] set true on // protocol found in file path");
  
  /*----Setup
  case : remote keyword error
  */
  mockStructureJS = getMockStructureJS({ 
    config : {
      directory_aliases : {remote : 'doesntMatterShouldError'}
    }
  });
  
  try{
    structureJS.resolveDirectoryAliases.call(
      mockStructureJS 
      , 'test'
      , 'shouldNotBeApplied'
    );
    
  }catch(e){
  /*Assertion*/
    assert.ok(true, 'Correctly threw RemoteKeywordFound error: ERROR: ' + e);
  }
  
  /*----Setup
  case : defaultBase correctly applied
  */
  mockStructureJS = getMockStructureJS();
  var baseCorrectlyApplied = structureJS.resolveDirectoryAliases.call(
                              mockStructureJS
                              , 'test'
                              , 'shouldBeApplied/'
                            );
    
  /*Assertion*/
  assert.equal(baseCorrectlyApplied, 'shouldBeApplied/test.js', 'defaultBase correctly applied');
  
  /*----Setup
  case : alias correctly found and replaced
  */
  var aliasCorrectlyApplied = structureJS.resolveDirectoryAliases.call(
                                mockStructureJS 
                                , 'export_bootstrap/test'
                                , 'shouldNotBeApplied/'
                              );
                              
  /*Assertion*/
   assert.equal(aliasCorrectlyApplied 
                , '../../structureJS/Bootstraps/test.js', 'defaultBase correctly applied');
                
});

QUnit.test('structureJS.resolveFilePath',function( assert ){
  var MockStructureJS = getMockStructureJS(
  {
    functionDependencies : {
      resolveDirectoryAliases : structureJS.resolveDirectoryAliases
    }
  });
  
  var inputObject = structureJS.resolveFilePath.call(MockStructureJS, {file1 : []});
  var inputString = structureJS.resolveFilePath.call(MockStructureJS, 'file1');
  var inputUglifyString = structureJS.resolveFilePath.call(MockStructureJS
                          , MockStructureJS.UGLYFY_FILENAME);
  
  assert.equal(inputObject, 'file1.js','input of type Object resolved correctly');
  assert.equal(inputString, 'file1.js','input of type String resolved correctly');
  assert.equal(inputUglifyString, 
              MockStructureJS.config.core_lib_folder + MockStructureJS.UGLYFY_FILENAME + '.js'
              , 'input of UGLYFY_FILENAME resolved correctly');
              
});
/*
  case : any files in config.commons put infront of modules X
  case : if state['pmiFilesSelectedForExport'] != '' 
            UGLYFY_FILENAME is placed at front of globals X
  case : config.globals should be in front X
  case : state['pmiFileOrder'] should be the same as state['resolvedFileList'] X
  case : created script tags should be in the same order as state['pmiFileOrder'] X
  case : onComplete should fire X
*/
QUnit.test('structureJS.loadModules',function( assert ){
  var mockInitState = {
    state : {
      resolvedFileList : ['resolved1','resolved2','resolved3'],
      pmiFilesSelectedForExport : 'export1, export2'
    },
    config : {
      commons : ['common1', 'common2'],
      globals : ['global1']
      
    },
    functionDependencies : {
      fakeHead : [],
      resolveDirectoryAliases : structureJS.resolveDirectoryAliases,
      resolveFilePath : structureJS.resolveFilePath,
      loadScript : function(url, onComplete){
        this.fakeHead.push(url);
        onComplete.call(null);
      },
      reset : function(){
        this.fakeHead.length = 0;
        this.state['resolvedFileList'] = ['resolved1','resolved2','resolved3'];
        this.state['pmiFileOrder'] = [];
        this.config.globals = ['global1'];
      }
    }
  };
  var MockStructureJS = getMockStructureJS(mockInitState);
  
  var filesToExportOutcome = ["lib/uglifyjs.min.js", "global1.js", "common1.js", "common2.js", 
                             "resolved1.js", "resolved2.js", "resolved3.js"];
  var noFilesToExportOutcome = ["global1.js", "common1.js", "common2.js", 
                                "resolved1.js", "resolved2.js", "resolved3.js"];                              
  
  structureJS.loadModules.call(MockStructureJS, {}, function(){
    assert.deepEqual(MockStructureJS.fakeHead, filesToExportOutcome 
                    , 'With files to export.');
    assert.deepEqual( filesToExportOutcome, MockStructureJS.state['pmiFileOrder'] 
                    , "Deep copy of state['resolvedFileList'] to state['pmiFileOrder'] working");
  });           
  
  MockStructureJS.reset();
  MockStructureJS.state['pmiFilesSelectedForExport'] = '';

 
  structureJS.loadModules.call(MockStructureJS, {}, function(){
      assert.deepEqual(MockStructureJS.fakeHead, noFilesToExportOutcome 
                      , 'With no files to export.');  
    });
  
});

/*
  case : if bootstrapping i|in requested, check proper outcome
  case : if bootstrapping is requested & bootstrapBase i|in set, check proper outcome
*/

QUnit.test('structureJS.loadConfigAndManifest',function( assert ){
  var mockInitState = {
    state : {
      resolvedFileList : ['resolved1','resolved2','resolved3'],
      pmiFilesSelectedForExport : ''
    },
    config : {
      commons : ['common1', 'common2'],
      globals : ['global1']
    },
    functionDependencies : {
      fakeHead : [],
      bootstrapConfigure : structureJS.bootstrapConfigure,
      extend : structureJS.extend,
      loadScript : function(url, onComplete){
        this.fakeHead.push(url);
        onComplete.call(null);
      },
      setBootstrapConfiguration : function(bootstrapAlias, bootstrapConfig){
        this.config.directory_aliases.bootstrap = bootstrapAlias;
        this.config.bootstrap_config = bootstrapConfig;
      },
      reset : function(){
        this.fakeHead.length = 0;
        this.state['resolvedFileList'] = ['resolved1','resolved2','resolved3'];
        this.state['pmiFileOrder'] = [];
        this.config.globals = ['global1'];
        /*As per the logic in loadConfigAndManifest, the following 2 statements
        should signal to loadConfigAndManifest NOT to load the bootstrap config*/
        this.setBootstrapConfiguration('',null);
        delete this.config.directory_aliases.bootstrap;
      }
    }
  };
  var MockStructureJS = getMockStructureJS(mockInitState);
  
  var bootstrapBase = 'bootstrapBase/';
  var bootstrapRequestedOutcome = ['config/config.js', 'bootstrap/Config/bootstrap.js', 
                                   'manifest/core-manifest.js'];
                                   
  var bootstrapBaseSet = ['config/config.js', bootstrapBase + 'Config/bootstrap.js', 
                          'manifest/core-manifest.js'];                                 
                          
  var bootstrapNotRequestedOutcome = ['config/config.js', 'manifest/core-manifest.js'];                              
  
  /* 
  UNECESSARY FOR THIS TEST
  NOTE : This should be used for unit testing proper loading of bootstrapped projects*/
  MockStructureJS.bootstrapConfigure(
  {
    commons : ['app','controller-declarations'], 
    globals : ['bootstrap/Angular/angular','bootstrap/Angular/angular-route']
  });
  /*UNECESSARY FOR THIS TEST*/
  
  /*case : if bootstrapping is not requested, check proper outcome*/
  MockStructureJS.setBootstrapConfiguration('bootstrap/','Config/bootstrap');
  
  structureJS.loadConfigAndManifest.call(
    MockStructureJS
    , function(){
        assert.deepEqual(MockStructureJS.fakeHead, bootstrapRequestedOutcome 
                        , 'Bootstrapping requested');
      }
  );           
  
  MockStructureJS.reset();
  
  /*case : if bootstrapping is not requested, check proper outcome*/
  structureJS.loadConfigAndManifest.call(
    MockStructureJS
    , function(){
        assert.deepEqual(MockStructureJS.fakeHead, bootstrapNotRequestedOutcome 
                        , 'Bootstrapping not requested');
      }
  );

  MockStructureJS.reset();
  
  /*case : if bootstrapping is requested & bootstrapBase is set, check proper outcome*/
  MockStructureJS.setBootstrapConfiguration('bootstrap/','Config/bootstrap');
  
  structureJS.loadConfigAndManifest.call(
    MockStructureJS
    , function(){
        assert.deepEqual(MockStructureJS.fakeHead, bootstrapBaseSet 
                        , 'Bootstrapping requested with bootstrapBase set');
      }
    , bootstrapBase 
  ); 
  
});

QUnit.test('structureJS.decodeInfoObj',function( assert ){

  assert.deepEqual(structureJS.decodeInfoObj('name'), {name : 'name'}, 'String passed works.');
  assert.deepEqual(structureJS.decodeInfoObj({name : 'name'}), {name : 'name'}, 'Object passed works.');
  try{
    structureJS.decodeInfoObj({notName : 'name'});
  }catch(e){
    assert.ok(true, 'Threw error on object with no  \'name\' property: ERROR: ' + e );
  }
});
/*
  case : 0 or 1 arguments should error
  case : arguments 2 is not a function should error
  case : modConfig.global_dependencies declared but is not array should error
  case : modConfig.global_dependencies declared, elements should be properties of window object
  case : void moduleFunction should error
  case : typeof state.modules[_moduleName_] should be Object
  case : typeof state.modules[_moduleName_]['module'] should be deinfed
*/
QUnit.test('structureJS.module',function( assert ){
  var mockInitState = {
    functionDependencies : {
      module : structureJS.module,
      decodeInfoObj : structureJS.decodeInfoObj,
      reset : function(){
        this.state['modules'] = {};
      }
    }
  };
  var MockStructureJS = getMockStructureJS(mockInitState);
  
  var mockModule = function(require){
    return {};
  };
  
  try{
    structureJS.module.call(MockStructureJS);
  }catch(e){
    assert.ok(true, 'Threw error with 0 arguments: ERROR: ' + e );
  }
  
  try{
    structureJS.module.call(MockStructureJS, function(){});
  }catch(e){
    assert.ok(true, 'Threw error modConfig != object or string (Function): ERROR:  ' + e );
  }
  
  try{
    structureJS.module.call(MockStructureJS, false);
  }catch(e){
    assert.ok(true, 'Threw error modConfig != object or string (Boolean primitive): ERROR: ' + e );
  }
  
  //window.scriptLoaded
  try{
    structureJS.module.call(
      MockStructureJS
      , {name : 'name', global_dependencies : 'scriptLoaded' }
      , mockModule
    );
  }catch(e){
    assert.ok(true, 'Threw error typeof global_dependencies != Array: ERROR: ' + e );
  }
  
  try{
    structureJS.module.call(
      MockStructureJS
      , {name : 'name', global_dependencies : ['notOnWindow'] }
      , mockModule
    );
  }catch(e){
    assert.ok(true, 'Threw error declared global_dependency not on window object: ERROR: ' + e );
  }
  
  try{
    structureJS.module.call(
      MockStructureJS
      , {name : 'name', global_dependencies : ['scriptLoaded'] }
      , mockModule
    );
    assert.ok(true, ' Declared global_dependency found on window object' );
  }catch(e){
    
  }
  
  try{
    structureJS.module.call(MockStructureJS, 'name', function(){});
  }catch(e){
    assert.ok(true, 'Threw error module didn\'t return anything: ERROR: ' + e );
  }
  
  structureJS.module.call(MockStructureJS, 'name', mockModule);
  assert.equal(
    typeof MockStructureJS.state.modules['name']
    , 'object'
    , "typeof state.modules[_moduleName_] should be Object"
  );
  
  assert.notEqual(
    typeof MockStructureJS.state.modules['name']['module']
    , 'undefined'
    , "typeof state.modules[_moduleName_]['module'] is not undefined"
  );
});
/*
  case : parameter 'name' must be string (throws)
  case : param 'dependencies' is added to state['dependencyTree'][_param_name_]
  case : if param 'dependencies' is not an array or is undefined, it is initailized as []
*/
QUnit.test('structureJS.declare',function( assert ){
  var paramName = 'name';
  var mockInitState = {
    functionDependencies : {
      reset : function(){
        this.state['dependencyTree'] = {};
      }
    }
  };
  var MockStructureJS = getMockStructureJS(mockInitState);
  
  try{
    structureJS.declare.call(MockStructureJS, {}, function(){});
  }catch(e){
    assert.ok(true, 'Param name is not string: ERROR: ' + e );
  }
  
  MockStructureJS.reset();
  
  structureJS.declare.call(MockStructureJS, paramName);
  
  assert.deepEqual(MockStructureJS.state['dependencyTree'][paramName],[]
                  , "Param 'dependencies' undefined, itialized to [] ");
  
  MockStructureJS.reset();
  
  structureJS.declare.call(MockStructureJS, paramName, 'notTypeArray');
  
  assert.deepEqual(MockStructureJS.state['dependencyTree'][paramName],[]
                  , "Param 'dependencies' not typeof Array, itialized to [] ");
  
  MockStructureJS.reset();
  
  structureJS.declare.call(MockStructureJS, paramName, ['dep1','dep2']);
  
  assert.deepEqual(MockStructureJS.state['dependencyTree'][paramName],['dep1','dep2']
                  , "Param 'dependencies' placed on core.state['dependencyTree'][_param_name_]");
  
});
























































};