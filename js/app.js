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
        numCells: 20,
        cellColour: "#ffffff",
        cellOpacity: 0.12,
        textColour: "#d5de8d"
    },
    gun: {
        colour: "#c07171"
    },
    program: {
        numCells: 20,
        cellColour: "#ffffff",
        cellOpacity: 0.12,
        textColour: "#c07171"
    },
    scene: {
        rotation: {
            y: 0.25
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
            y: 500,
            z: 1000
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
        program: true,
        helpers: false,
        directionLight: true,
        pointLight: true,
        ambientLight: true
    }
};

var container, stats;

var fog;

var floorMaterial, memBoxMaterial, memFrontTextMaterial, memSideTextMaterial, memoryTextMaterial, gunMaterial;
var programBoxMaterial, programFrontTextMaterial, programSideTextMaterial, programTextMaterial;

var camera, cameraTarget, scene, renderer;

var group, gunGroup, programGroup, memoryGroup;

var targetRotation = settings.scene.rotation.y;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var commands = [ '>', '<', '+', '-', '.', ',', '[', ']' ];
var commandTexts = {};
var currentCommandText;

var input = '23\n';
var inputPointer = 0;

//var code = "+[--->++<]>++++..."; // Outputs: ZZZ
//var code = "-[--->+<]>-------.>--[----->+<]>-.++++.+++."; // Outputs: Neil
var code = '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.'; // Outputs: Hello World!
var codeSize = code.length;
var codePointer = -1;

var memory = {};
var memorySize = 10000;
var memoryPointer = 0;

// Init loopIn and loopOut
var loopIn = {}, loopOut = {};
var tmp = [];
for (var cp = 0; cp < codeSize; cp++) {
    if (code[cp] == '[') {
        tmp.push(cp);
    }
    else if (code[cp] == ']') {
        loopOut[loopIn[cp] = tmp.pop()] = cp;
    }
}

// Init DEBUG memory
//for (var n=0; n<memorySize; n++) {
//    memory[n] = n;
//}

var nextCommandInterval;

var animState = {
    commandBulletPosition: { z: -50 },
    programGroupPosition: { x: 0 },
    memoryGroupPosition: { x: 0 },
    program: {
        leftEndPositionX: -55 * (settings.program.numCells / 2),
        rightEndPositionX: 55 * (settings.program.numCells / 2),
        leftMostCellNum: 0,
        rightMostCellNum: settings.program.numCells-1,
        hiddenCellNum: settings.program.numCells-1,
        leftMostCellPositionX: 0,
        rightMostCellPositionX: 0,
        codePointer: codePointer
    },
    memory: {
        leftEndPositionX: -55 * (settings.memory.numCells / 2),
        rightEndPositionX: 55 * (settings.memory.numCells / 2),
        currentCellNum: settings.memory.numCells / 2,
        leftMostCellNum: 0,
        rightMostCellNum: settings.memory.numCells-1,
        hiddenCellNum: settings.memory.numCells-1,
        leftMostCellPositionX: 0,
        rightMostCellPositionX: 0
    }
};

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

    memFrontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour, shading: THREE.FlatShading } );
    memSideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour, shading: THREE.SmoothShading } );
    memoryTextMaterial = new THREE.MeshFaceMaterial( [ memFrontTextMaterial, memSideTextMaterial ] );

    memBoxMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.cellColour, opacity: settings.memory.cellOpacity, transparent: true } );

    memoryGroup = new THREE.Group();

    var memoryPointerOffset = (settings.memory.numCells / 2);
    var memoryCellOffset = (settings.memory.numCells / 2);
    animState.memory.leftMostCellPositionX = 55 * (-memoryCellOffset);

    var memoryCellGroup;
    for (var cellNum=0; cellNum<settings.memory.numCells; cellNum++) {
        var memPointer = cellNum - memoryPointerOffset;
        if (memPointer < 0) {
            memPointer = memorySize + memPointer;
        }
        memoryCellGroup = new THREE.Group();
        memoryCellGroup.name = "memoryCellGroup" + cellNum;
        memoryCellGroup.add( createText( "memoryText", getMemoryValue(memPointer)+"", memoryTextMaterial ) );
        memoryCellGroup.add( createBox( memBoxMaterial ) );
        memoryCellGroup.position.x = 55 * (cellNum -  memoryCellOffset);

        memoryGroup.add(memoryCellGroup);
    }
    animState.memory.rightMostCellPositionX = memoryCellGroup.position.x;

    // MEMORY ENDS

    var memBoxEndsMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.cellColour } );
    var leftMemEnd = createBox( memBoxEndsMaterial );
    leftMemEnd.position.setX(animState.memory.leftEndPositionX);
    var rightMemEnd = createBox( memBoxEndsMaterial );
    rightMemEnd.position.setX(animState.memory.rightEndPositionX);

    // PROGRAM

    programFrontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.textColour, shading: THREE.FlatShading } );
    programSideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.textColour, shading: THREE.SmoothShading } );
    programTextMaterial = new THREE.MeshFaceMaterial( [ programFrontTextMaterial, programSideTextMaterial ] );

    programBoxMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.cellColour, opacity: settings.program.cellOpacity, transparent: true } );

    programGroup = new THREE.Group();

    var programPointerOffset = (settings.program.numCells / 2) + 1;
    var programCellOffset = (settings.program.numCells / 2);
    animState.program.leftMostCellPositionX = 55 * (-programCellOffset);
    var programCellGroup;
    for (cellNum=0; cellNum<settings.program.numCells; cellNum++) {
        var cp = cellNum - programPointerOffset;
        programCellGroup = new THREE.Group();
        programCellGroup.name = "programCellGroup" + cellNum;
        var command = (cp < 0 || cp >= codeSize ? "" : code[cp]);
        programCellGroup.add( createText( "programText", command, programTextMaterial ) );
        programCellGroup.add( createBox( programBoxMaterial ) );
        programCellGroup.position.x = 55 * (cellNum - programCellOffset);

        programGroup.add(programCellGroup);
    }
    animState.program.rightMostCellPositionX = programCellGroup.position.x;

    programGroup.position.z = 300;
    programGroup.position.x = 0;

    // PROGRAM ENDS

    var programBoxEndsMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.cellColour } );
    var leftProgramEnd = createBox( programBoxEndsMaterial );
    leftProgramEnd.position.setX(animState.program.leftEndPositionX);
    leftProgramEnd.position.setZ(300);
    var rightProgramEnd = createBox( programBoxEndsMaterial );
    rightProgramEnd.position.setX(animState.program.rightEndPositionX);
    rightProgramEnd.position.setZ(300);

    // COMMAND TEXT

    var numCommands = commands.length;
    for (var i=0; i<numCommands; i++) {
        var cmd = commands[i];
        var cmdText = createText( "cmdText_" + cmd, cmd, programTextMaterial );
        cmdText.position.z = -50;
        commandTexts[cmd] = cmdText;
    }

    // GUN

    gunGroup = new THREE.Group();
    gunMaterial = new THREE.MeshPhongMaterial( {
        color: settings.gun.colour } );
    var gunBox = createGunBox( gunMaterial );
    var gunBarrel = createGunBarrel( gunMaterial );

    gunGroup.add( gunBox );
    gunGroup.add( gunBarrel );
    gunGroup.position.z = 300;

    // GROUP

    group = new THREE.Group();
    group.add(floor);
    group.add(leftMemEnd);
    group.add(memoryGroup);
    group.add(rightMemEnd);
    group.add(gunGroup);
    group.add(leftProgramEnd);
    group.add(programGroup);
    group.add(rightProgramEnd);
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
    gui.close();

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
        memFrontTextMaterial.color.setStyle(value);
        memSideTextMaterial.color.setStyle(value);
    });

    var programFolder = gui.addFolder("Program");
    programFolder.addColor(settings.program, 'cellColour').name("cell colour").onChange(function(value){
        programBoxMaterial.color.setStyle(value);
    });
    programFolder.add(settings.program, 'cellOpacity', 0, 1).name("cell opacity").onChange(function(value){
        programBoxMaterial.opacity = value;
    });
    programFolder.addColor(settings.program, 'textColour').name("text colour").onChange(function(value){
        programFrontTextMaterial.color.setStyle(value);
        programSideTextMaterial.color.setStyle(value);
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
    cameraPositionFolder.add(settings.camera.position, 'z', -1300, 1300).onChange(function(value){
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
    renderFolder.add(settings.render, 'program').onChange(function(value){
        programGroup.visible = value;
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

    // Start program
    startNextCommandLoop();
}

function startNextCommandLoop() {
    nextCommandInterval = setInterval(nextCommand, 3000);
}

function setAllMaterialsNeedUpdate() {
    floorMaterial.needsUpdate = true;
    memBoxMaterial.needsUpdate = true;
    memFrontTextMaterial.needsUpdate = true;
    memSideTextMaterial.needsUpdate = true;
    gunMaterial.needsUpdate = true;
    programBoxMaterial.needsUpdate = true;
    programFrontTextMaterial.needsUpdate = true;
    programSideTextMaterial.needsUpdate = true;
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

    TWEEN.update();
    render();
    stats.update();
}

function nextCommand() {

    codePointer++;

    if (codePointer === codeSize) {
        clearInterval(nextCommandInterval);
        return;
    }

    animateProgramToTheLeft(processCommand);
}

function processCommand() {

    var cmd = code[codePointer], prevCodePointer, times;

    switch(cmd) {
        case '>':
            memoryPointer++;
            if (memoryPointer === memorySize) {
                memoryPointer = 0;
            }
            fireCommandBullet(cmd, animateMemoryToTheLeft);
            break;

        case '<':
            memoryPointer--;
            if (memoryPointer < 0) {
                memoryPointer = memorySize-1;
            }
            fireCommandBullet(cmd, animateMemoryToTheRight);
            break;

        case '+':
            memory[memoryPointer] = ((memory[memoryPointer] || 0) + 1) & 255;
            fireCommandBullet(cmd, animateMemoryValueChanged);
            break;

        case '-':
            memory[memoryPointer] = ((memory[memoryPointer] || 0) - 1) & 255;
            fireCommandBullet(cmd, animateMemoryValueChanged);
            break;

        case '[':
            if (!memory[memoryPointer]) {
                prevCodePointer = codePointer;

                codePointer = loopOut[codePointer];

                times = codePointer - prevCodePointer;

                clearInterval(nextCommandInterval);
                nextCommandInterval = null;
                setIntervalLoop(animateProgramToTheLeft, 1000, times, startNextCommandLoop)

            } else if (nextCommandInterval == null) {

                startNextCommandLoop();
            }
            break;

        case ']':
            prevCodePointer = codePointer;

            codePointer = loopIn[codePointer];

            times = prevCodePointer - codePointer;

            clearInterval(nextCommandInterval);
            nextCommandInterval = null;
            setIntervalLoop(animateProgramToTheRight, 1000, times, processCommand);
            break;

        case ',':
            memory[memoryPointer] = input.charCodeAt(inputPointer++) || 0;
            break;

        case '.':
            console.log(String.fromCharCode(memory[memoryPointer]));
            break;
    }
}

function fireCommandBullet(cmd, onCompleteCallback) {
    currentCommandText = commandTexts[cmd];
    currentCommandText.position.setZ(-50);
    gunGroup.add(currentCommandText);
    animState.commandBulletPosition.z = -50;
    var bulletTween = new TWEEN.Tween( animState.commandBulletPosition )
        .to( { z: -300 }, 1000 )
        .onUpdate( function () {
            currentCommandText.position.setZ(this.z);
        } )
        .onComplete( function () {
            gunGroup.remove(currentCommandText);
            onCompleteCallback();
        })
        .start();
}

function incrementCellNumWithWrap(cellNum, totalNumCells) {
    return (cellNum + 1) % totalNumCells;
}

function decrementCellNumWithWrap(cellNum, totalNumCells) {
    var newCellNum = cellNum - 1;
    if (newCellNum < 0) {
        newCellNum = totalNumCells - 1;
    }
    return newCellNum;
}

function incrementMemoryCellNumWithWrap(cellNum) {
    return incrementCellNumWithWrap(cellNum, settings.memory.numCells);
}

function decrementMemoryCellNumWithWrap(cellNum) {
    return decrementCellNumWithWrap(cellNum, settings.memory.numCells);
}

function incrementProgramCellNumWithWrap(cellNum) {
    return incrementCellNumWithWrap(cellNum, settings.program.numCells);
}

function decrementProgramCellNumWithWrap(cellNum) {
    return decrementCellNumWithWrap(cellNum, settings.program.numCells);
}

function setIntervalLoop(fn, delay, times, onComplete) {
    var counter = 0;
    var i = setInterval(function () {
        fn();

        counter++;
        if (counter === times) {
            clearInterval(i);

            onComplete();
        }
    }, delay);
}


function animateMemoryToTheLeft() {

    var rightMostCell = scene.getObjectByName("memoryCellGroup" + animState.memory.rightMostCellNum);
    if (animState.memoryGroupPosition.x + rightMostCell.position.x != animState.memory.rightEndPositionX) {

        // Setup the next memory cell ready to be scrolled into the memory view from the right
        animState.memory.leftMostCellNum = incrementMemoryCellNumWithWrap(animState.memory.leftMostCellNum);
        animState.memory.rightMostCellNum = incrementMemoryCellNumWithWrap(animState.memory.rightMostCellNum);

        animState.memory.leftMostCellPositionX += 55;
        animState.memory.rightMostCellPositionX += 55;

        var nextCell = scene.getObjectByName("memoryCellGroup" + animState.memory.rightMostCellNum);
        var memoryText = nextCell.getObjectByName("memoryText");

        var nextShownMemoryPointer = (memoryPointer + (settings.memory.numCells / 2) - 1) % memorySize;
        var nextShownMemoryValue = getMemoryValue(nextShownMemoryPointer);
        var newMemoryText = createText( "memoryText", nextShownMemoryValue, memoryTextMaterial );
        nextCell.remove(memoryText);
        nextCell.add(newMemoryText);
        nextCell.position.setX(animState.memory.rightMostCellPositionX);
    }
    animState.memory.currentCellNum = incrementMemoryCellNumWithWrap(animState.memory.currentCellNum);

    // Move memory group
    var memoryTween = new TWEEN.Tween( animState.memoryGroupPosition )
        .to( { x: "-55" }, 500 )
        .onUpdate( function () {
            memoryGroup.position.setX(this.x);
        } )
        .start();
}

function animateProgramToTheLeft(onCompleteFn) {

    animState.program.codePointer++;

    var rightMostCell = scene.getObjectByName("programCellGroup" + animState.program.rightMostCellNum);
    if (animState.programGroupPosition.x + rightMostCell.position.x != animState.program.rightEndPositionX) {

        // Setup the next program cell ready to be scrolled into the program view from the right
        animState.program.leftMostCellNum = incrementProgramCellNumWithWrap(animState.program.leftMostCellNum);
        animState.program.rightMostCellNum = incrementProgramCellNumWithWrap(animState.program.rightMostCellNum);

        animState.program.leftMostCellPositionX += 55;
        animState.program.rightMostCellPositionX += 55;

        var nextCell = scene.getObjectByName("programCellGroup" + animState.program.rightMostCellNum);
        var programText = nextCell.getObjectByName("programText");

        var nextShownProgramPointer = animState.program.codePointer + (settings.program.numCells / 2) - 1;
        var nextShownProgramValue = nextShownProgramPointer < codeSize ? code[nextShownProgramPointer] : "";

        var newProgramText = createText( "programText", nextShownProgramValue, programTextMaterial );
        nextCell.remove(programText);
        nextCell.add(newProgramText);
        nextCell.position.setX(animState.program.rightMostCellPositionX);
    }

    // Move program group
    var programTween = new TWEEN.Tween( animState.programGroupPosition )
        .to( { x: "-55" }, 500 )
        .onUpdate( function () {
            programGroup.position.setX(this.x);
        } );
    if (onCompleteFn) {
        programTween.onComplete(onCompleteFn);
    }
    programTween.start();
}

function animateProgramToTheRight() {

    animState.program.codePointer--;

    var leftMostCell = scene.getObjectByName("programCellGroup" + animState.program.leftMostCellNum);
    if (animState.programGroupPosition.x + leftMostCell.position.x != animState.program.leftEndPositionX) {

        // Setup the next program cell ready to be scrolled into the program view from the right
        animState.program.leftMostCellNum = decrementProgramCellNumWithWrap(animState.program.leftMostCellNum);
        animState.program.rightMostCellNum = decrementProgramCellNumWithWrap(animState.program.rightMostCellNum);

        animState.program.leftMostCellPositionX -= 55;
        animState.program.rightMostCellPositionX -= 55;

        var nextCell = scene.getObjectByName("programCellGroup" + animState.program.leftMostCellNum);
        var programText = nextCell.getObjectByName("programText");

        var nextShownProgramPointer = animState.program.codePointer - ((settings.program.numCells / 2) - 1);
        var nextShownProgramValue = nextShownProgramPointer >= 0 ? code[nextShownProgramPointer] : "";

        var newProgramText = createText( "programText", nextShownProgramValue, programTextMaterial );
        nextCell.remove(programText);
        nextCell.add(newProgramText);
        nextCell.position.setX(animState.program.leftMostCellPositionX);
    }

    // Move program group
    var programTween = new TWEEN.Tween( animState.programGroupPosition )
        .to( { x: "+55" }, 500 )
        .onUpdate( function () {
            programGroup.position.setX(this.x);
        } )
        .start();
}

function debugMemory() {
    var msg = "";
    for (var i=0; i < settings.memory.numCells; i++) {
        var cell = scene.getObjectByName("memoryCellGroup" + i);
        msg += "[" + i + ":" + (cell.position.x + memoryGroup.position.x) + "]";
    }
    console.log(msg);
    console.log("leftMostCellNum", animState.memory.leftMostCellNum, "currentCellNum", animState.memory.currentCellNum, "rightMostCellNum", animState.memory.rightMostCellNum);
}

function debugProgram() {
    var msg = "";
    for (var i=0; i < settings.program.numCells; i++) {
        var cell = scene.getObjectByName("programCellGroup" + i);
        msg += "[" + i + ":" + (cell.position.x + programGroup.position.x) + "]";
    }
    console.log(msg, "leftMostCellNum", animState.program.leftMostCellNum, "rightMostCellNum", animState.program.rightMostCellNum);
}

function animateMemoryToTheRight() {

    // Setup the next memory cell ready to be scrolled into the memory view from the left
    var leftMostCell = scene.getObjectByName("memoryCellGroup" + animState.memory.leftMostCellNum);
    if (animState.memoryGroupPosition.x + leftMostCell.position.x != animState.memory.leftEndPositionX) {

        animState.memory.leftMostCellNum = decrementMemoryCellNumWithWrap(animState.memory.leftMostCellNum);
        animState.memory.rightMostCellNum = decrementMemoryCellNumWithWrap(animState.memory.rightMostCellNum);

        animState.memory.leftMostCellPositionX -= 55;
        animState.memory.rightMostCellPositionX -= 55;

        var nextCell = scene.getObjectByName("memoryCellGroup" + animState.memory.leftMostCellNum);
        var memoryText = nextCell.getObjectByName("memoryText");

        var nextShownMemoryPointer = (memoryPointer - (settings.memory.numCells / 2) - 1);
        if (nextShownMemoryPointer < 0) {
            nextShownMemoryPointer = memorySize - 1;
        }
        var nextShownMemoryValue = getMemoryValue(nextShownMemoryPointer);
        var newMemoryText = createText("memoryText", nextShownMemoryValue, memoryTextMaterial);
        nextCell.remove(memoryText);
        nextCell.add(newMemoryText);
        nextCell.position.setX(animState.memory.leftMostCellPositionX);
    }
    animState.memory.currentCellNum = decrementMemoryCellNumWithWrap(animState.memory.currentCellNum);

    // Move memory group
    var memoryTween = new TWEEN.Tween( animState.memoryGroupPosition )
        .to( { x: "+55" }, 500 )
        .onUpdate( function () {
            memoryGroup.position.setX(this.x);
        } )
        .start();
}

function animateMemoryValueChanged() {
    var memCellGroup = scene.getObjectByName("memoryCellGroup" + animState.memory.currentCellNum);
    var memText = memCellGroup.getObjectByName("memoryText");

    var newMemText = createText( "memoryText", memory[memoryPointer], memoryTextMaterial );
    memCellGroup.remove(memText);
    memCellGroup.add(newMemText);
}

function getMemoryValue(cellNum) {
    return memory[cellNum]||0;
}

function render() {
    group.rotation.y += ( targetRotation - group.rotation.y ) * 0.05;

    camera.lookAt( cameraTarget );

    renderer.render( scene, camera );
}

// Brainfuck interpreter
// Source: https://code.google.com/p/jslibs/wiki/JavascriptTips
