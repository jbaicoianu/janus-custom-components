var blockSize = 1;
var miniBlockSize = 0.037;
var placeMode = true;
var timecounter=0;
var timer=50;
var BlockArrow;
var HUDBlock;
var HUDBlockNext;
var HUDBlockPre;
var blockIndex = 0;
var blockArray = [
"bedrock", "brick", "clay", "coal", "coal_ore", "cobble", "mossy_cobble",
"command", "diamond", "diamond_ore", "dirt", "emerald",
"emerald_ore", "endstone", "glowstone", "gold", "gold_ore", "hard_clay",
"black_clay","blue_clay", "brown_clay", "cyan_clay","gray_clay", "green_clay", "light_blue_clay",
"lime_clay", "magenta_clay", "orange_clay", "pink_clay", "purple_clay", "red_clay",
"light_gray_clay", "white_clay", "yellow_clay", "packed_ice", "iron", "iron_ore", "lapis",
"lapis_ore", "nether_brick", "netherrack", "noteblock", "obsidian", "acacia", "dark_oak", "birch",
"jungle", "oak", "spruce", "prismarine_brick", "dark_prismarine", "orange_sand", "redstone_block",
"lamp_off", "lamp_on", "redstone_ore", "sand", "snow", "sponge", "wet_sponge",
"stone", "stone_brick", "circle_stone_brick", "cracked_stone_brick", "moss_stone_brick", "black_wool",
"blue_wool", "brown_wool", "cyan_wool", "gray_wool", "green_wool", "light_blue_wool", "lime_wool",
"magenta_wool", "orange_wool", "pink_wool", "purple_wool", "red_wool",
"light_gray_wool", "white_wool", "yellow_wool"
];
var imageArray= [
"7hT7oD5", "6CZHb9X", "RY8K1VT", "fviVcjD", "Udd8Ept", "cj0h6cj", "hT81WkC",
"RtcDW7U", "yhVXdzo", "pvcYr2I", "7tPx0bC", "mKNnJwm",
"6Uz93GG", "6ls9gG1", "kTKFgtB", "ZFYsjtP", "iMuxBu1", "L3cgzv0",
"R28Y636", "9Ljz8YV", "uVDMcQY", "e4oAlue", "REtZUfW", "hHn9w0g", "SPrr7Gg",
"97gNHPH", "iiMvgd2", "tf2ONGK", "Ax1cmgL", "adqwaMV", "x6MgaNc",
"LVdjzBi", "eMtAUDR", "5lSzald", "Vh6ugd8", "gl41bpW", "buyunHV",
"l9Diijp", "HHUWSao", "OJONVk5", "WeSUHvi", "9lPOLbc", "JUAFcJL",
"d2e8h8Q", "t42Af25", "OuMgJns", "UAqC73Y", "ZppfWB7", "gVuJCFG",
"gHSaf5g", "pbalJkH", "PKnNJwk", "Tgd6BV9", "Fi0pOpD", "h5FjSUS",
"6HXZHHw", "8s63qCg", "Mq4NLct", "7XuayJx", "6ThIQTq", "r68Cf3j",
"XfTwyV9", "IVISr6U", "Q0E7nkf", "i2ieaKk", "9GjRb8j", "DQW3CHB", "hUFSc0O",
"C65QvjO", "nVYnio4", "3OlMXwr", "Fr2fAOU", "NkCOyNU", "Znwfmcl", "0p36v1s",
"vv5IJzb", "5Ph7JOQ", "eE6Rp4n", "QWKZjE4", "GZLB9cY", "bLp3wad"
];


room.onLoad = function() {

	for(var i=0;i<blockArray.length;++i){
		room.loadNewAsset("Object",{id:blockArray[i],src:"https://nazrin.net/Minecraft-Sandbox/cube.obj", tex0:"http://i.imgur.com/"+imageArray[i]+".png", tex_linear:"false"});
    }

  BlockArrow = room.createObject("Object", {id: "cone", js_id: "Cone" + uniqueId(),col:Vector(1,0,0),  scale: Vector(miniBlockSize), lighting: true});
  BlockArrow.xdir = Vector(0,0,-1);
  BlockArrow.ydir = Vector(0,-1,0);
  BlockArrow.zdir = Vector(-1,0,0);
  
  BlockArrowNext = room.createObject("Object", {id: "cone2", js_id: "Cone2",col:Vector(0,0,1), scale: Vector(miniBlockSize), lighting: true});
  BlockArrowPre = room.createObject("Object", {id: "cone3", js_id: "Cone3",col:Vector(0,0,1), scale: Vector(miniBlockSize), lighting: true});
  
  HUDBlock = room.createObject("Object", {id: blockArray[blockIndex], js_id: "HUD" + uniqueId(), scale: Vector(miniBlockSize), lighting: true});
  HUDBlockNext = room.createObject("Object", {id: blockArray[blockArray.length - 1], js_id: "HUD1" + uniqueId(), scale: Vector(miniBlockSize), lighting: true});
  HUDBlockPre = room.createObject("Object", {id: blockArray[blockIndex + 1], js_id: "HUD2" + uniqueId(), scale: Vector(miniBlockSize), lighting: true});

};

room.onMouseDown = function(){
  if(placeMode){
    if(distance(player.hand0_pos,BlockArrowNext.pos)<0.1||distance(player.hand1_pos,BlockArrowNext.pos)<0.1  && timer<timecounter){
      decreaseBlockIndex();
      timer=timecounter+50;
    }else if(distance(player.hand0_pos,BlockArrowPre.pos)<0.1||distance(player.hand1_pos,BlockArrowPre.pos)<0.1  && timer<timecounter){
      increaseBlockIndex();
      timer=timecounter+50;
    }else{
      var position = Vector(0,0,0);
      var baseObject;
      if(player.cursor0_active==1 && player.cursor1_active==0){
        baseObject = player.cursor0_object;
      }else if(player.cursor0_active==0 && player.cursor1_active==1){
        baseObject = player.cursor1_object;
      }else if(player.cursor0_active==0 && player.cursor1_active==0){
        //clicking the sky;
        return;
      }else if(player.cursor0_active==1 && player.cursor1_active==1){
        //both controllers
        return;
      }else{
        //janusweb
        baseObject = player.cursor_object;
      }
      if(baseObject[0] =="D"){
        if(player.cursor0_active==1 && player.cursor1_active==0){
          position = Vector(Math.round(player.cursor0_pos.x),Math.round(player.cursor0_pos.y),Math.round(player.cursor0_pos.z));
        }else if(player.cursor0_active==0 && player.cursor1_active==1){
          position = Vector(Math.round(player.cursor1_pos.x),Math.round(player.cursor1_pos.y),Math.round(player.cursor1_pos.z));
        }else{
          //janusweb
          position = Vector(Math.round(player.cursor_pos.x),Math.round(player.cursor_pos.y),Math.round(player.cursor_pos.z));
        }
      }else if(baseObject != "par1" && baseObject != "par2" && baseObject[0] !="_" && !!baseObject){
        var cursorOffset
        if(player.cursor0_active==1 && player.cursor1_active==0){
          cursorOffset = translate(player.cursor0_pos, scalarMultiply(room.objects[baseObject].pos, -1));
        }else if(player.cursor0_active==0 && player.cursor1_active==1){
          cursorOffset = translate(player.cursor1_pos, scalarMultiply(room.objects[baseObject].pos, -1));
        }else{
          //janusweb
          cursorOffset = translate(player.cursor_pos, scalarMultiply(room.objects[baseObject].pos, -1));
        }
        if(Math.abs(cursorOffset.x)>Math.abs(cursorOffset.y) && Math.abs(cursorOffset.x)>Math.abs(cursorOffset.z)){
          //x
          if(cursorOffset.x>0){
            //+x 
            position = translate(room.objects[baseObject].pos,Vector(1,0,0));
          }else{
            //-x
            position = translate(room.objects[baseObject].pos,Vector(-1,0,0));
          }
        }else if(Math.abs(cursorOffset.y)>Math.abs(cursorOffset.x) && Math.abs(cursorOffset.y)>Math.abs(cursorOffset.z)){
          //y
          if(cursorOffset.y>0){
            //+y
            position = translate(room.objects[baseObject].pos,Vector(0,1,0));
          }else{
            //-y
            position = translate(room.objects[baseObject].pos,Vector(0,-1,0));
          }
         }else if(Math.abs(cursorOffset.z)>Math.abs(cursorOffset.x)  && Math.abs(cursorOffset.z)>Math.abs(cursorOffset.y)){
          //z
          if(cursorOffset.z>0){
            //+z
            position = translate(room.objects[baseObject].pos,Vector(0,0,1));
          }else{
            //-z
            position = translate(room.objects[baseObject].pos,Vector(0,0,-1));
          }
        }else{
          //???
          return;
        }
      }else{
        //???
        return;
      }
      //Round location to the nearest int. Everything must grid!
      position.x=Math.round(position.x);
      position.y=Math.round(position.y);
      position.z=Math.round(position.z);

      var blockid = uniqueId() + player.userid;
      var newBlock = room.createObject("Object", {id: blockArray[blockIndex],  js_id: blockid, collision_id: blockArray[blockIndex],pos: position,  scale: Vector(blockSize), lighting: true});
      newBlock.sync = true;
    }
  }
};

room.update = function(td){
  if(placeMode){
    timecounter += td;
    //tmpVec is the coords of .5 meter in front of your face
    var tmpVec =  translate(scalarMultiply(player.view_dir,.5),player.head_pos);
    //find the player's rotation angle
    var playerxrot= Math.atan2(-player.view_dir.x, -player.view_dir.z);
    
    BlockArrowPre.pos = translate(tmpVec,Vector(Math.cos(playerxrot)*.05,-0.0185,-Math.sin(playerxrot)*.05));
    rotateXYZ(playerxrot,0,0);
    //translate .1 meters to the right
    // HUDBlockNext.pos.x = tmpVec.x + Math.cos(playerxrot)*.1;
    // HUDBlockNext.pos.y = tmpVec.y;
    // HUDBlockNext.pos.z = tmpVec.z - Math.sin(playerxrot)*.1;
    // let's do that in less space and math:
    HUDBlockNext.pos = translate(tmpVec,Vector(Math.cos(playerxrot)*.1,0,-Math.sin(playerxrot)*.1));
    
    HUDBlock.pos = translate(tmpVec,Vector(Math.cos(playerxrot)*.15,0,-Math.sin(playerxrot)*.15));
    
    //make it float too
    // BlockArrow.pos.y = tmpVec.y + 1.5*miniBlockSize + Math.abs(0.03*Math.sin(timecounter/300));
    BlockArrow.pos = translate(tmpVec,Vector(Math.cos(playerxrot)*.15,1.5*miniBlockSize + Math.abs(0.03*Math.sin(timecounter/300)),-Math.sin(playerxrot)*.15));

    HUDBlockPre.pos = translate(tmpVec,Vector(Math.cos(playerxrot)*.2,0,-Math.sin(playerxrot)*.2));

    BlockArrowNext.pos = translate(tmpVec,Vector(Math.cos(playerxrot)*.25,-0.0185,-Math.sin(playerxrot)*.25));
    }
};

//euler angles to rotation matrix
function rotateXYZ(xrot, yrot, zrot){
  var A       = Math.cos(xrot);
  var B       = Math.sin(xrot);
  var C       = Math.cos(yrot);
  var D       = Math.sin(yrot);
  var E       = Math.cos(zrot);
  var F       = Math.sin(zrot);

  var xdir = Vector(A*E , A*F , -B);
  var ydir = Vector(D*B*E - C*F , D*B*F + C*E , A*D);
  var zdir = Vector(C*B*E + D*F , C*B*F - D*E , A*C);
  
  HUDBlockNext.xdir = xdir;
  HUDBlockNext.ydir = ydir;
  HUDBlockNext.zdir = zdir;
  
  HUDBlock.xdir = xdir;
  HUDBlock.ydir = ydir;
  HUDBlock.zdir = zdir;
  
  HUDBlockPre.xdir = xdir;
  HUDBlockPre.ydir = ydir;
  HUDBlockPre.zdir = zdir;
  
  BlockArrowNext.xdir = xdir;
  BlockArrowNext.ydir = ydir;
  BlockArrowNext.zdir = zdir;
  
  BlockArrowPre.xdir = xdir;
  BlockArrowPre.ydir = ydir;
  BlockArrowPre.zdir = zdir;
  
}

room.onKeyDown = function(e){
    if (e.keyCode == '1') {
        e.preventDefault();
        decreaseBlockIndex();
    }
    else if (e.keyCode == '2') {
        e.preventDefault();
        increaseBlockIndex();
    }
    
    if (e.keyCode == 'G'){
        e.preventDefault();
        placeMode = !placeMode;
        HUDBlock.visible = !HUDBlock.visible;
        HUDBlockNext.visible = !HUDBlockNext.visible;
        BlockArrow.visible = !BlockArrow.visible;
        HUDBlockPre.visible = !HUDBlockPre.visible;
    }
}
function updateHUDBlock(){
    HUDBlock.id=blockArray[blockIndex];
    HUDBlockPre.id=blockArray[(blockIndex+1)%blockArray.length];
    if(blockIndex == 0){
        HUDBlockNext.id=blockArray[blockArray.length - 1];    
    }
    else{
        HUDBlockNext.id=blockArray[blockIndex-1];  
    }
}
function decreaseBlockIndex(){
    --blockIndex;
    if(blockIndex < 0){
        blockIndex = blockArray.length - 1;
    }
    updateHUDBlock();
}
function increaseBlockIndex(){
    ++blockIndex;
    if(blockIndex >= blockArray.length){
        blockIndex = 0;
    }
    updateHUDBlock();
}