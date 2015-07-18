if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var settings = {
    fog: {
        colour: "#dedede",
        near: 450,
        far: 1400
    },
    floor: {
        colour: "#3d4269"
    },
    memory: {
        cellNumber: 50,
        cellColour: "#ffffff",
        cellOpacity: 0.12,
        textColour: "#d5de8d"
    },
    gun: {
        colour: "#c07171"
    },
    scene: {
        rotation: {
            y: -0.5
        }
    },
    ambientLight: {
        colour: "#695b5b"
    },
    directionalLight: {
        colour: "#ffffff",
        intensity: 0.125,
        position: {
            x: 0,
            y: 0,
            z: 1
        }
    },
    pointLight: {
        colour: "#a08686",
        intensity: 1.5,
        distance: 0,
        position: {
            x: 0,
            y: 100,
            z: 90
        }
    },
    camera: {
        position: {
            x: 0,
            y: 200,
            z: 700
        },
        target: {
            x: 0,
            y: 20,
            z: 0
        }
    },
    render: {
        fog: false,
        floor: false,
        memory: true,
        gun: true,
        bullet: true,
        helpers: false,
        directionLight: true,
        pointLight: true,
        ambientLight: true
    }
};

var container, stats;

var fog;

var floorMaterial, memBoxMaterial, frontTextMaterial, sideTextMaterial, gunMaterial;

var camera, cameraTarget, scene, renderer;

var group;

//var text = "  0  12  34 156  78 255   0   0   0   0",

var targetRotation = settings.scene.rotation.y;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var y_diff = 0.1;

var bulletObject = "plusText";

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // CAMERA

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 2500 );
    camera.position.set( settings.camera.position.x, settings.camera.position.y, settings.camera.position.z );
    cameraTarget = new THREE.Vector3( settings.camera.target.x, settings.camera.target.y, settings.camera.target.z );

    // SCENE

    fog = new THREE.Fog( settings.fog.colour, settings.fog.near, settings.fog.far );

    scene = new THREE.Scene();
    if (settings.render.fog) {
        scene.fog = fog;
    }

    // LIGHTS

    var dirLight = new THREE.DirectionalLight( settings.directionalLight.colour, settings.directionalLight.intensity );
    dirLight.position.set( settings.directionalLight.position.x, settings.directionalLight.position.y, settings.directionalLight.position.z );
    if (settings.render.directionLight) {
        scene.add(dirLight);
    }
    var pointLight = new THREE.PointLight( settings.pointLight.colour, settings.pointLight.intensity, settings.pointLight.distance );
    pointLight.position.set( settings.pointLight.position.x, settings.pointLight.position.y, settings.pointLight.position.z );
    if (settings.render.pointLight) {
        scene.add(pointLight);
    }
    var ambientLight = new THREE.AmbientLight( settings.ambientLight.colour );
    if (settings.render.ambientLight) {
        scene.add(ambientLight);
    }

    // FLOOR

    floorMaterial = new THREE.MeshBasicMaterial( {
        color: settings.floor.colour, transparent: false
    } );
    var floor = createPlane(floorMaterial);
    floor.visible = settings.render.floor;

    // MEMORY

    frontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour, shading: THREE.FlatShading } );
    sideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour, shading: THREE.SmoothShading } );
    var textMaterial = new THREE.MeshFaceMaterial( [ frontTextMaterial, sideTextMaterial ] );

    memBoxMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.cellColour, opacity: settings.memory.cellOpacity, transparent: true } );

    var memoryGroup = new THREE.Group();

    var memoryCellXOffset = -(settings.memory.cellNumber / 2) * 55; //-275;
    for (var cellNum=0; cellNum<settings.memory.cellNumber; cellNum++) {

        var memoryCellGroup = new THREE.Group();
        memoryCellGroup.name = "memCellGroup" + cellNum;
        memoryCellGroup.add( createText( "memText", "255", textMaterial ) );
        memoryCellGroup.add( createMemoryBox( memBoxMaterial ) );
        memoryCellGroup.position.x = (55 * cellNum) + memoryCellXOffset;

        memoryGroup.add(memoryCellGroup);
    }

    // COMMAND CHARACTERS

    var plusCommand = createText( "plusText", "+", textMaterial );
    plusCommand.visible = false;

    var minusCommand = createText( "minusText", "-", textMaterial );
    minusCommand.visible = false;

    // GUN

    var gunGroup = new THREE.Group();
    gunMaterial = new THREE.MeshPhongMaterial( {
        color: settings.gun.colour } );
    var gunBox = createGunBox( gunMaterial );
    var gunBarrel = createGunBarrel( gunMaterial );

    gunGroup.add( gunBox );
    gunGroup.add( gunBarrel );
    gunGroup.add( plusCommand );
    gunGroup.add( minusCommand );
    gunGroup.position.z = 300;

    // GROUP

    group = new THREE.Group();
    group.add(floor);
    group.add(memoryGroup);
    group.add(gunGroup);
    scene.add( group );

    // HELPERS

    var dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
    var pointLightHelper = new THREE.PointLightHelper(pointLight, 10);
    var gridHelper = new THREE.GridHelper( 1000, 20 );
    var axisHelper = new THREE.AxisHelper( 50 );
    var cameraHelper = new THREE.CameraHelper(camera);

    if (settings.render.helpers) {
        scene.add(dirLightHelper);
        scene.add(pointLightHelper);
        scene.add(axisHelper);
        group.add(gridHelper);
        group.add(cameraHelper);
    }

    // RENDERER

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setClearColor( settings.fog.colour );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.sortObjects = false;
    container.appendChild( renderer.domElement );

    // STATS

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    // EVENTS

    container.addEventListener( 'mousedown', onDocumentMouseDown, false );
    window.addEventListener( 'resize', onWindowResize, false );

    // SETTINGS GUI

    var gui = new dat.GUI();

    var fogFolder = gui.addFolder("Fog");
    fogFolder.addColor(settings.fog, "colour").onChange(function(value){
        fog.color.setStyle(value);
        renderer.setClearColor( value );
    });
    fogFolder.add(settings.fog, 'near', 1, 2000).onChange(function(value){
        fog.near = value;
    });
    fogFolder.add(settings.fog, 'far', 1, 2000).onChange(function(value){
        fog.far = value;
    });

    var ambientLightFolder = gui.addFolder("Ambient Light");
    ambientLightFolder.addColor(settings.ambientLight, "colour").onChange(function(value){
        ambientLight.color.setStyle(value);
    });

    var dirLightFolder = gui.addFolder("Directional Light");
    dirLightFolder.addColor(settings.directionalLight, "colour").onChange(function(value){
        dirLight.color.setStyle(value);
    });
    dirLightFolder.add(settings.directionalLight, 'intensity', 0, 10).onChange(function(value){
        dirLight.intensity = value;
    });
    dirLightFolder.add(settings.directionalLight.position, 'x', -1000, 1000).onChange(function(value){
        dirLight.position.setX(value);
    });
    dirLightFolder.add(settings.directionalLight.position, 'y', -1000, 1000).onChange(function(value){
        dirLight.position.setY(value);
    });
    dirLightFolder.add(settings.directionalLight.position, 'z', -1000, 1000).onChange(function(value){
        dirLight.position.setZ(value);
    });

    var pointLightFolder = gui.addFolder("Point Light");
    pointLightFolder.addColor(settings.pointLight, "colour").onChange(function(value){
        pointLight.color.setStyle(value);
    });
    pointLightFolder.add(settings.pointLight, 'intensity', 0, 10).onChange(function(value){
        pointLight.intensity = value;
    });
    pointLightFolder.add(settings.pointLight, 'distance', 0, 1000).onChange(function(value){
        pointLight.distance = value;
    });
    pointLightFolder.add(settings.pointLight.position, 'x', -1000, 1000).onChange(function(value){
        pointLight.position.setX(value);
    });
    pointLightFolder.add(settings.pointLight.position, 'y', -1000, 1000).onChange(function(value){
        pointLight.position.setY(value);
    });
    pointLightFolder.add(settings.pointLight.position, 'z', -1000, 1000).onChange(function(value){
        pointLight.position.setZ(value);
    });

    var floorFolder = gui.addFolder("Floor");
    floorFolder.addColor(settings.floor, "colour").onChange(function(value){
        floorMaterial.color.setStyle(value);
    });

    var memFolder = gui.addFolder("Memory");
    memFolder.addColor(settings.memory, 'cellColour').name("cell colour").onChange(function(value){
        memBoxMaterial.color.setStyle(value);
    });
    memFolder.add(settings.memory, 'cellOpacity', 0, 1).name("cell opacity").onChange(function(value){
        memBoxMaterial.opacity = value;
    });
    memFolder.addColor(settings.memory, 'textColour').name("text colour").onChange(function(value){
        frontTextMaterial.color.setStyle(value);
        sideTextMaterial.color.setStyle(value);
    });

    var gunFolder = gui.addFolder("Gun");
    gunFolder.addColor(settings.gun, 'colour').onChange(function(value){
        gunMaterial.color.setStyle(value);
    });

    var sceneFolder = gui.addFolder("Scene");
    var sceneRotationFolder = sceneFolder.addFolder("Rotation");
    sceneRotationFolder.add(settings.scene.rotation, 'y', -2 * Math.PI, 2 * Math.PI).listen().onChange(function(value){
        targetRotation = value;
    });

    var cameraFolder = gui.addFolder("Camera");
    var cameraPositionFolder = cameraFolder.addFolder("Position");
    cameraPositionFolder.add(settings.camera.position, 'x', -1000, 1000).onChange(function(value){
        camera.position.setX(value);
    });
    cameraPositionFolder.add(settings.camera.position, 'y', -1000, 1000).onChange(function(value){
        camera.position.setY(value);
    });
    cameraPositionFolder.add(settings.camera.position, 'z', -1000, 1000).onChange(function(value){
        camera.position.setZ(value);
    });
    var cameraTargetFolder = cameraFolder.addFolder("Target");
    cameraTargetFolder.add(settings.camera.target, 'x', -1000, 1000).onChange(function(value){
        cameraTarget.x = value;
    });
    cameraTargetFolder.add(settings.camera.target, 'y', -1000, 1000).onChange(function(value){
        cameraTarget.y = value;
    });
    cameraTargetFolder.add(settings.camera.target, 'z', -1000, 1000).onChange(function(value){
        cameraTarget.z = value;
    });

    var renderFolder = gui.addFolder("Render");
    renderFolder.add(settings.render, 'fog').onChange(function(value){
        if (value) {
            scene.fog = fog;
        } else {
            scene.fog = null;
        }
        setAllMaterialsNeedUpdate();
    });
    renderFolder.add(settings.render, 'floor').onChange(function(value){
        floor.visible = value;
    });
    renderFolder.add(settings.render, 'memory').onChange(function(value){
        memoryGroup.visible = value;
    });
    renderFolder.add(settings.render, 'gun').onChange(function(value){
        gunGroup.visible = value;
    });
    renderFolder.add(settings.render, 'bullet').onChange(function(value){
        settings.render.bullet = value;
        var bullet = scene.getObjectByName(bulletObject);
        bullet.visible = value;
    });
    renderFolder.add(settings.render, 'helpers').onChange(function(value){
        cameraHelper.visible = value;

        if (value) {
            scene.add(dirLightHelper);
            scene.add(pointLightHelper);
            scene.add(axisHelper);
            scene.add(cameraHelper);
            group.add(gridHelper);
        } else {
            scene.remove(dirLightHelper);
            scene.remove(pointLightHelper);
            scene.remove(axisHelper);
            scene.remove(cameraHelper);
            group.remove(gridHelper);
        }
    });
    renderFolder.add(settings.render, 'directionLight').name("direction light").onChange(function(value){
        if (value) {
            scene.add(dirLight);
            setAllMaterialsNeedUpdate();
        } else {
            scene.remove(dirLight);
        }
    });
    renderFolder.add(settings.render, 'pointLight').name("point light").onChange(function(value){
        if (value) {
            scene.add(pointLight);
            setAllMaterialsNeedUpdate();
        } else {
            scene.remove(pointLight);
        }
    });
    renderFolder.add(settings.render, 'ambientLight').name("ambient light").onChange(function(value){
        if (value) {
            scene.add(ambientLight);
            setAllMaterialsNeedUpdate();
        } else {
            scene.remove(ambientLight);
        }
    });
}

function setAllMaterialsNeedUpdate() {
    memBoxMaterial.needsUpdate = true;
    floorMaterial.needsUpdate = true;
    frontTextMaterial.needsUpdate = true;
    sideTextMaterial.needsUpdate = true;
    gunMaterial.needsUpdate = true;
}

function createPlane(material) {
    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 10000, 10000 ),
        material
    );
    plane.position.y = -10;
    plane.rotation.x = - Math.PI / 2;
    return plane;
}

function createText(name, text, material) {

    var textGeo = new THREE.TextGeometry( text, {

        size: 15,
        height: 10,
        curveSegments: 4,
        font: "helvetiker",
        weight: "bold",
        style: "normal",
        bevelThickness: 2,
        bevelSize: 1.5,
        bevelEnabled: true,

        material: 0,
        extrudeMaterial: 1

    });

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();

    var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

    var textMesh1 = new THREE.Mesh( textGeo, material );

    textMesh1.name = name;
    textMesh1.userData = { memValue: parseInt(text, 10) };
    textMesh1.position.x = centerOffset;
    textMesh1.position.y = 15;
    textMesh1.position.z = -5;

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;

    return textMesh1;
}

function createMemoryBox(material) {

    var geometry = new THREE.BoxGeometry( 50, 50, 50 );
    var box = new THREE.Mesh( geometry, material );
    box.position.y = 25;
    return box;
}

function createGunBox(material) {

    var geometry = new THREE.BoxGeometry( 30, 30, 30 );
    var box = new THREE.Mesh( geometry, material );
    box.position.y = 25;
    return box;
}

function createGunBarrel(material) {

    var geometry = new THREE.BoxGeometry( 10, 10, 20 );
    var box = new THREE.Mesh( geometry, material );
    box.position.y = 25;
    box.position.z = -25;
    return box;
}

//			function refreshText() {
//
//				group.remove( textMesh1 );
//
//				if ( !text ) return;
//
//				createText();
//			}


function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );

    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDown = targetRotation;
}

function onDocumentMouseMove( event ) {

    mouseX = event.clientX - windowHalfX;

    targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
    settings.scene.rotation.y = targetRotation;
}

function onDocumentMouseUp( event ) {

    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {

    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();
}

function updateMemoryCell() {
    var memCellGroup = scene.getObjectByName("memCellGroup5");
    var memText = memCellGroup.getObjectByName("memText");

    var memValue = memText.userData.memValue;
    var newMemValue = (memValue + 1) % 255;

    var newMemText = createText( "memText", newMemValue+"", textMaterial );
    memCellGroup.remove(memText);
    memCellGroup.add(newMemText);
}

function render() {
    group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;

    //if (group.position.y >= 120 || group.position.y <= 80) {
    //    y_diff = -y_diff;
    //}
    //group.position.y += y_diff;

    // Update memory cell
    //updateMemoryCell();

    // render bullet
    if (settings.render.bullet) {
        var bullet = scene.getObjectByName(bulletObject);
        bullet.visible = true;
        var bulletZPos = (bullet.position.z - 5);
        if (bulletZPos < -300) {
            bulletZPos = -50;
            bullet.visible = false;
            bulletObject = (bulletObject == "plusText") ? "minusText" : "plusText";
        }
        bullet.position.setZ(bulletZPos);
    }

    camera.lookAt( cameraTarget );

    //renderer.clear();
    renderer.render( scene, camera );
}

// Brainfuck interpreter
// Source: https://code.google.com/p/jslibs/wiki/JavascriptTips
/*
 var code = '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.';
 var inp = '23\n';
 var out = '';

 var codeSize = code.length;
 var i = 0, ip = 0, cp = 0, dp = 0, m = {};

 var loopIn = {}, loopOut = {};
 var tmp = [];
 for ( var cp = 0; cp < codeSize ; cp++ )
 if ( code[cp] == '[' )
 tmp.push(cp);
 else
 if ( code[cp] == ']' )
 loopOut[loopIn[cp] = tmp.pop()] = cp;

 for (var cp = 0; cp < codeSize && i < 100000; cp++, i++) {

 switch(code[cp]) {

 case '>': dp++; break;
 case '<': dp--; break;
 case '+': m[dp] = ((m[dp]||0)+1)&255; break
 case '-': m[dp] = ((m[dp]||0)-1)&255; break;
 case '.': out += String.fromCharCode(m[dp]); break;
 case ',': m[dp] = inp.charCodeAt(ip++)||0; break;
 case '[': m[dp]||(cp=loopOut[cp]); break;
 case ']': cp = loopIn[cp]-1; break;
 }
 }
 Print(out);

 */