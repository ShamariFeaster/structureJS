structureJS.declare('Modules/C');  
structureJS.declare('Modules/D',['DB']);
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

structureJS.declareGroup({
    name : 'DB2', 
    description : 'API for client-side DB functions'
  });  
  
structureJS.declareGroup({
    name : 'DB3', 
    description : 'API for client-side DB functions'
  });
//populate group  
structureJS.UI_Events.declare('Modules/MouseListener');
structureJS.UI_Events.declare('Modules/KeyListener');
structureJS.UI_Events.declare('Modules/DragResize', ['DB']);
structureJS.UI_Events.declare('DB');

structureJS.DB.declare('Modules/IdbClient');
structureJS.DB.declare('Modules/Mongo', ['DB2']);
structureJS.DB.declare('DB2');

structureJS.DB2.declare('Modules/MouseListener');
structureJS.DB2.declare('Modules/DragResize', ['DB3']);
structureJS.DB2.declare('DB3');

structureJS.DB3.declare('Modules/D');
structureJS.DB3.declare('Modules/C');