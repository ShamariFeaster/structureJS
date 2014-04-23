structureJS.configure(
{ /*project_base is set by user. There's no default because we cannot know where a 
  user will have even a single project. We certainly don't want them to put it in here*/
  
  structureJS_base : './',/*export script is in same directory as structureJS lib*/
  module_base : 'Modules/', 
  global_base : 'lib/',
  commons : [], 
  globals : []
},{
  download_minified : false,
  minified_output_tag_id : 'minified'

});

