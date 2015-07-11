if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var settings = {
    fog: {
        colour: "#000000",
        near: 450,
        far: 1400
    },
    floor: {
        colour: "#3d4269"
    },
    memory: {
        colour: "#02d2df",
        opacity: 0.5
    },
    scene: {
        rotation: {
            y: -0.5
        }
    },
    ambientLight: {
        colour: "#404040"
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
        colour: "#0065ff",
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
        fog: true,
        floor: true,
        memory: true
    }
};

var container, stats;

var fog;

var textMaterial;

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

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // CAMERA

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 1500 );
    camera.position.set( settings.camera.position.x, settings.camera.position.y, settings.camera.position.z );
    cameraTarget = new THREE.Vector3( settings.camera.target.x, settings.camera.target.y, settings.camera.target.z );

    // SCENE

    fog = new THREE.Fog( settings.fog.colour, settings.fog.near, settings.fog.far );

    scene = new THREE.Scene();
    scene.fog = fog;

    // LIGHTS

    var dirLight = new THREE.DirectionalLight( settings.directionalLight.colour, settings.directionalLight.intensity );
    dirLight.position.set( settings.directionalLight.position.x, settings.directionalLight.position.y, settings.directionalLight.position.z );
    scene.add( dirLight );

    var pointLight = new THREE.PointLight( settings.pointLight.colour, settings.pointLight.intensity, settings.pointLight.distance );
    pointLight.position.set( settings.pointLight.position.x, settings.pointLight.position.y, settings.pointLight.position.z );
    scene.add( pointLight );

    var ambientLight = new THREE.AmbientLight( settings.ambientLight.colour );

    scene.add( ambientLight );

    // MESHES

    var floorMaterial = new THREE.MeshBasicMaterial( {
        color: settings.floor.colour, transparent: false
    } );
    textMaterial = new THREE.MeshFaceMaterial( [
        new THREE.MeshPhongMaterial( {
            color: 0xffffff, shading: THREE.FlatShading } ), // front
        new THREE.MeshPhongMaterial( {
            color: 0xffffff, shading: THREE.SmoothShading } ) // side
    ] );
    var memBoxMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.colour, opacity: settings.memory.opacity, transparent: true } );

    var memoryGroup = new THREE.Group();

    for (var cellNum=0; cellNum<10; cellNum++) {

        var memoryCellGroup = new THREE.Group();
        memoryCellGroup.name = "memCellGroup" + cellNum;
        memoryCellGroup.add( createText( "memText", "255", textMaterial ) );
        memoryCellGroup.add( createBox( memBoxMaterial ) );
        memoryCellGroup.position.x = (55 * cellNum) - 275;

        memoryGroup.add(memoryCellGroup);
    }

    var floor = createPlane(floorMaterial);

    group = new THREE.Group();
    group.add(floor);
    group.add(memoryGroup);

    scene.add( group );

    // RENDERER

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( settings.fog.colour );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    // STATS

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    // EVENT

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
    memFolder.addColor(settings.memory, 'colour').onChange(function(value){
        memBoxMaterial.color.setStyle(value);
    });
    memFolder.add(settings.memory, 'opacity', 0, 1).onChange(function(value){
        memBoxMaterial.opacity = value;
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
        memBoxMaterial.needsUpdate = true;
        floorMaterial.needsUpdate = true;
        textMaterial.needsUpdate = true;
    });
    renderFolder.add(settings.render, 'floor').onChange(function(value){
        floor.visible = value;
    });
    renderFolder.add(settings.render, 'memory').onChange(function(value){
        memoryGroup.visible = value;
    });
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

function createBox(material) {

    var geometry = new THREE.BoxGeometry( 50, 50, 50 );
    var box = new THREE.Mesh( geometry, material );
    box.position.y = 25;
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

    if (group.position.y >= 120 || group.position.y <= 80) {
        y_diff = -y_diff;
    }
    //group.position.y += y_diff;

    // Update memory cell
    //updateMemoryCell();

    camera.lookAt( cameraTarget );

    renderer.clear();
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