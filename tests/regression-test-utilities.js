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
      cache : { structureJSTag : null, test : 'uyesy' } 
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