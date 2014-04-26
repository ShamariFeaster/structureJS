structureJS.declare('Modules/C');  
structureJS.declare('Modules/D');
//structureJS.declare('remote/group-UI');
//structureJS.declare('D-jquery-dep', ['DB','C']);


structureJS.declareGroup({
    name : 'UI_Events', 
    description : 'Designed to handle responsive UI functions'
  });

structureJS.declareGroup({
    name : 'DB', 
    description : 'API for client-side DB functions'
  });  

//populate group  
structureJS.UI_Events.declare('Modules/MouseListener');
structureJS.UI_Events.declare('Modules/KeyListener');
structureJS.UI_Events.declare('Modules/DragResize', ['DB']);
structureJS.UI_Events.declare('DB');

structureJS.DB.declare('Modules/IdbClient');
structureJS.DB.declare('Modules/Mongo');
