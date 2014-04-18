structureJS.declare('C', ['UI_Events']);  
structureJS.declare('D',['C']);


structureJS.declareGroup('UI_Events');
//OR
/*
structureJS.declareGroup({
    name : 'UI-Events', 
    description : 'Designed to handle responsive UI functions'
  });
*/
//populate group  
structureJS.UI_Events.declare('KeyListener');
structureJS.UI_Events.declare('MouseListener');
structureJS.UI_Events.declare('DragResize', ['MouseListener']);