if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var settings = {
    fog: {
        colour: "#141414",
        near: 925,
        far: 2000
    },
    floor: {
        colour: "#3d4269"
    },
    memory: {
        numCells: 24,
        cellColour: "#ffffff",
        cellOpacity: 0.12,
        textColour: "#d5de8d"
    },
    gun: {
        colour: "#c07171"
    },
    program: {
        numCells: 24,
        cellColour: "#ffffff",
        cellOpacity: 0.12,
        textColour: "#c07171"
    },    
    output: {
        numCells: 24,
        cellColour: "#ffffff",
        cellOpacity: 0.12,
        textColour: "#70b4f0"
    },
    input: {
        numCells: 24,
        cellColour: "#ffffff",
        cellOpacity: 0.12,
        textColour: "#70f08e"
    },
    labels: {
        textColour: "#ffffff"
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
            y: 290,
            z: 190
        }
    },
    camera: {
        position: {
            x: 0,
            y: 290,
            z: 1500
        },
        target: {
            x: 0,
            y: 290,
            z: 0
        }
    },
    render: {
        fog: false,
        floor: false,
        memory: true,
        gun: true,
        program: true,
        output: true,
        input: true,
        labels: true,
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
var outputBoxMaterial, outputFrontTextMaterial, outputSideTextMaterial, outputTextMaterial;
var inputBoxMaterial, inputFrontTextMaterial, inputSideTextMaterial, inputTextMaterial;

var cmdMaterial;

var camera, cameraTarget, scene, renderer;

var group, gunGroup, programGroup, memoryGroup, outputGroup, inputGroup;
var inputLabel, programLabel, memoryLabel, outputLabel;

var targetRotation = settings.scene.rotation.y;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var commands = [ '>', '<', '+', '-', '.', ',', '[', ']' ];
var commandTexts = {};
var currentCommandText;

//var input = '-=!@#$%^&*()_+,.<>?[]\\{}|;\':"`~';
//var input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-=!@#$%^&*()_+,.<>?[]\\{}|;\':"`~';
var inputPointer = 0;

//var allPrintableAsciiChars = "";
//for (var n=32; n<127; n++) {
//    allPrintableAsciiChars += String.fromCharCode(n);
//}
//console.log("Printable ASCII Chars: ", allPrintableAsciiChars);

var presetPrograms = [
    //{
    //    name: "Test Spaces",
    //    rawCode: ",.>.,.>.,.",
    //    input: "ABC"
    //},
    {
        name: "Add Two Numbers",
        rawCode:
"### Add Two Numbers ###\n\
\n\
,       Read character from Input and store it in Cell #0\n\
>       Move pointer to Cell #1\n\
,       Read character from Input and store it in Cell #1\n\
[           Enter loop\n\
    <       Move pointer to Cell #0\n\
    +       Increment Cell #0\n\
    >       Move pointer to Cell #1\n\
    -       Decrement Cell #1\n\
]           We exit the loop when the last cell is empty\n\
<       Go back to Cell #0\n\
------------------------------------------------ Subtract 48 (ie ASCII char code of '0')\n\
.       Output Cell #0",
        input: "12"
    },
    {
        name: "Copy",
        rawCode:
"### Copy ###\n\
\n\
+[>,]       Read all characters from Input and store in Memory\n\
<[<]>>      Move pointer to Cell #0\n\
[.>]        Output all non zero Memory values",
        input: "ECHO"
    },
    {
        name: "Hello World",
        rawCode:
"### Hello World ###\n\
\n\
+++++ +++               Set Cell #0 to 8\n\
[\n\
    >++++               Add 4 to Cell #1; this will always set Cell #1 to 4\n\
    [                   as the cell will be cleared by the loop\n\
        >++             Add 2 to Cell #2\n\
        >+++            Add 3 to Cell #3\n\
        >+++            Add 3 to Cell #4\n\
        >+              Add 1 to Cell #5\n\
        <<<<-           Decrement the loop counter in Cell #1\n\
    ]                   Loop till Cell #1 is zero; number of iterations is 4\n\
    >+                  Add 1 to Cell #2\n\
    >+                  Add 1 to Cell #3\n\
    >-                  Subtract 1 from Cell #4\n\
    >>+                 Add 1 to Cell #6\n\
    [<]                 Move back to the first zero cell you find; this will\n\
                        be Cell #1 which was cleared by the previous loop\n\
    <-                  Decrement the loop Counter in Cell #0\n\
]                       Loop till Cell #0 is zero; number of iterations is 8\n\
\n\
The result of this is:\n\
Cell No :   0   1   2   3   4   5   6\n\
Contents:   0   0  72 104  88  32   8\n\
Pointer :   ^\n\
\n\
>>.                     Cell #2 has value 72 which is 'H'\n\
>---.                   Subtract 3 from Cell #3 to get 101 which is 'e'\n\
+++++++..+++.           Likewise for 'llo' from Cell #3\n\
>>.                     Cell #5 is 32 for the space\n\
<-.                     Subtract 1 from Cell #4 for 87 to give a 'W'\n\
<.                      Cell #3 was set to 'o' from the end of 'Hello'\n\
+++.------.--------.    Cell #3 for 'rl' and 'd'\n\
>>+.                    Add 1 to Cell #5 gives us an exclamation point",
        input: ""
    },
    {
        name: "Powers of Two",
        rawCode: ">++++++++++>>+<+[[+++++[>++++++++<-]>.<++++++[>--------<-]+<<]>.>[->[<++>-[<++>-[<++>-[<++>-[<-------->>[-]++<-[<++>-]]]]]]<[>+<-]+>>]<<] ",
        input: ""
    },
    {
        name: "Printable ASCII Chars",
        rawCode: ",.[>,.]",
        input: " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
    },
    {
        name: "Reverse",
        rawCode:
"### REVERSE ###\n\
\n\
>     Move pointer to Cell #1\n\
,     Read first character from Input and store it in Cell #1\n\
[>,]  Read all remaining characters from Input and store in Memory\n\
<     Move pointer to the final non zero value\n\
[.<]  Output all non zero Memory values from right to left",
        input: "DESREVER"
    },
    {
        name: "ROT13",
        rawCode:
"### ROT13 ###\n\
\n\
-,+[                  Read first character and start outer character reading loop\n\
  -[                  Skip forward if character is 0\n\
    >>++++            Set up divisor (32) for division loop\n\
    [>++++++++<-]       (MEMORY LAYOUT: dividend copy remainder divisor quotient zero zero)\n\
    <+<-[             Set up dividend (x minus 1) and enter division loop\n\
      >+>+>-[>>>]     Increase copy and remainder / reduce divisor / Normal case: skip forward\n\
      <[[>+<-]>>+>]   Special case: move remainder back to divisor and increase quotient\n\
      <<<<<-          Decrement dividend\n\
    ]                 End division loop\n\
  ]>>>[-]+              End skip loop; zero former divisor and reuse space for a flag\n\
  >--[-[<->+++[-]]]<[ Zero that flag unless quotient was 2 or 3; zero quotient; check flag\n\
    ++++++++++++<[    If flag then set up divisor (13) for second division loop\n\
                        (MEMORY LAYOUT: zero copy dividend divisor remainder quotient zero zero)\n\
      >-[>+>>]        Reduce divisor; Normal case: increase remainder\n\
      >[+[<+>-]>+>>]  Special case: increase remainder / move it back to divisor / increase quotient\n\
      <<<<<-          Decrease dividend\n\
    ]                 End division loop\n\
    >>[<+>-]          Add remainder back to divisor to get a useful 13\n\
    >[                Skip forward if quotient was 0\n\
      -[              Decrement quotient and skip forward if quotient was 1\n\
        -<<[-]>>      Zero quotient and divisor if quotient was 2\n\
      ]<<[<<->>-]>>   Zero divisor and subtract 13 from copy if quotient was 1\n\
    ]<<[<<+>>-]       Zero divisor and add 13 to copy if quotient was 0\n\
  ]                   End outer skip loop (jump to here if ((character minus 1)/32) was not 2 or 3)\n\
  <[-]                Clear remainder from first division if second division was skipped\n\
  <.[-]               Output ROT13ed character from copy and clear it\n\
  <-,+                Read next character\n\
]                     End character reading loop",
        input: "PVCURE"
    },
    {
        name: "Sort",
        rawCode: ">>,[>>,]<<[[-<+<]>[>[>>]<[.[-]<[[>>+<<-]<]>>]>]<<]",
        input: "CAB"
    },
    {
        name: "Sort2",
        rawCode:
"### Sort2 ###\n\
\n\
>       (start padding)\n\
,[>,]   read input\n\
+       count=1\n\
[           while count !=0\n\
    <[-<]   decrement all inputs\n\
    >[>]    go to an input that was just decremented to zero or padding\n\
    >       point to next input or more padding\n\
    [           if not padding\n\
        <-      change the 0 to 255 so it doesn't stop the next decrement pass\n\
        [>]<.   point to and print count\n\
        >>      point to more padding\n\
    ]\n\
    <<+     increment count\n\
]",
        input: "CAB"
    },
    {
        name: "Translate Binary to ASCII",
        rawCode: ">,[>>>++++++++[<[<++>-]<+[>+<-]<-[-[-<]>]>[-<]<,>>>-]<.[-]<<]",
        input: "0110100001101001"
    },
    {
        name: "Translate to BF",
        rawCode: "+++++[>+++++++++<-],[[>--.++>+<<-]>+.->[<.>-]<<,]",
        input: "HELLO WORLD"
    }
];

//var code = "+[--->++<]>++++..."; // Outputs: ZZZ
//var code = "-[--->+<]>-------.>--[----->+<]>-.++++.+++."; // Outputs: Neil

var DEFAULT_PRESET_NUM = 0; // Copy
var DEFAULT_PROGRAM = presetPrograms[DEFAULT_PRESET_NUM];
var rawCode = DEFAULT_PROGRAM.rawCode;
var code = extractBFCommands(rawCode);
var input = DEFAULT_PROGRAM.input;

var codeSize = code.length;
var codePointer = -1;

var memory = {};
var memorySize = 10000;
var memoryPointer = 0;

var output = '';

var loopIn = {}, loopOut = {};

// Init DEBUG memory
//for (var n=0; n<memorySize; n++) {
//    memory[n] = n;
//}

var animState;
var ANIM_TIME = 500;

var playerState = {
    isRunning: false,
    isStepping: false,
    isReset: true
};

var runConfigOverlayElement, programElement, inputElement;
var editor;
var infoOverlayElement, previousPageElement, nextPageElement;
var resetElement, runToggleElement, stepElement;
var speedInputElement;
var speedDisplayElement;
var presetProgramElement;
var currentCommandElement;

var infoPageNum = 1;
var MAX_INFO_PAGES = 1;

init();
animate();

function extractBFCommands(rawCode) {
    return rawCode.replace(/[^\+\-\.\[\],<>]/g, '');
}

function resetProgramState() {
    inputPointer = 0;
    codeSize = code.length;
    codePointer = -1;

    memory = {};
    memoryPointer = 0;

    output = '';

    loopIn = {};
    loopOut = {};

    // Init loopIn and loopOut
    var tmp = [];
    for (var cp = 0; cp < codeSize; cp++) {
        if (code[cp] == '[') {
            tmp.push(cp);
        }
        else if (code[cp] == ']') {
            loopOut[loopIn[cp] = tmp.pop()] = cp;
        }
    }
}

function resetOutputCells() {
    var outputCellOffset = (settings.output.numCells / 2);
    animState.output.leftMostCellPositionX = 55 * (-outputCellOffset);
    var outputCellGroup;
    for (var cellNum=0; cellNum<settings.output.numCells; cellNum++) {
        outputCellGroup = scene.getObjectByName("outputCellGroup" + cellNum);
        var outputText = outputCellGroup.getObjectByName("outputText");
        var newOutputText = createText( "outputText", "", outputTextMaterial );
        outputCellGroup.remove(outputText);
        outputCellGroup.add(newOutputText);
        outputCellGroup.position.x = 55 * (cellNum - outputCellOffset);
    }
    animState.output.rightMostCellPositionX = outputCellGroup.position.x;

    outputGroup.position.x = 0;
}

function resetMemoryCells() {
    var memoryPointerOffset = (settings.memory.numCells / 2);
    var memoryCellOffset = (settings.memory.numCells / 2);
    animState.memory.leftMostCellPositionX = 55 * (-memoryCellOffset);

    var memoryCellGroup;
    for (var cellNum=0; cellNum<settings.memory.numCells; cellNum++) {
        var memPointer = cellNum - memoryPointerOffset;
        if (memPointer < 0) {
            memPointer = memorySize + memPointer;
        }
        memoryCellGroup = scene.getObjectByName("memoryCellGroup" + cellNum);
        var memoryText = memoryCellGroup.getObjectByName("memoryText");
        var newMemoryText = createText( "memoryText", getMemoryValue(memPointer)+"", memoryTextMaterial );
        memoryCellGroup.remove(memoryText);
        memoryCellGroup.add(newMemoryText);
        memoryCellGroup.position.x = 55 * (cellNum -  memoryCellOffset);
    }
    animState.memory.rightMostCellPositionX = memoryCellGroup.position.x;

    memoryGroup.position.x = 0;
}

function resetProgramCells() {
    var programPointerOffset = (settings.program.numCells / 2) + 1;
    var programCellOffset = (settings.program.numCells / 2);
    animState.program.leftMostCellPositionX = 55 * (-programCellOffset);
    var programCellGroup;
    for (var cellNum=0; cellNum<settings.program.numCells; cellNum++) {
        var cp = cellNum - programPointerOffset;
        var command = (cp < 0 || cp >= codeSize ? "" : code[cp]);
        programCellGroup = scene.getObjectByName("programCellGroup" + cellNum);
        var programText = programCellGroup.getObjectByName("programText");
        var newProgramText = createProgramText(command);
        programCellGroup.remove(programText);
        programCellGroup.add(newProgramText);
        programCellGroup.position.x = 55 * (cellNum - programCellOffset);
    }
    animState.program.rightMostCellPositionX = programCellGroup.position.x;

    programGroup.position.x = 0;
}

function resetInputCells() {
    var inputCellOffset = (settings.input.numCells / 2);
    animState.input.leftMostCellPositionX = 55 * (-inputCellOffset);
    var inputCellGroup;
    for (var cellNum=0; cellNum<settings.input.numCells; cellNum++) {
        var ip = cellNum - inputCellOffset;
        var inputChar = (ip < 0 || ip >= input.length ? "" : input[ip]);
        inputCellGroup = scene.getObjectByName("inputCellGroup" + cellNum);
        var inputText = inputCellGroup.getObjectByName("inputText");
        var newInputText = createText( "inputText", inputChar, inputTextMaterial );
        inputCellGroup.remove(inputText);
        inputCellGroup.add(newInputText);
        inputCellGroup.position.x = 55 * (cellNum - inputCellOffset);
    }
    animState.input.rightMostCellPositionX = inputCellGroup.position.x;

    inputGroup.position.x = 0;
}

function resetCells() {

    resetOutputCells();
    resetMemoryCells();
    resetProgramCells();
    resetInputCells();
}

function resetBullet() {
    gunGroup.remove(currentCommandText);
}

function resetAnimState() {
    animState = {
        commandBulletPosition: { z: -50 },
        programGroupPosition: { x: 0 },
        memoryGroupPosition: { x: 0 },
        outputGroupPosition: { x: 0 },
        inputGroupPosition: { x: 0 },
        program: {
            leftEndPositionX: -55 * (settings.program.numCells / 2),
            rightEndPositionX: 55 * (settings.program.numCells / 2),
            leftMostCellNum: 0,
            rightMostCellNum: settings.program.numCells-1,
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
            leftMostCellPositionX: 0,
            rightMostCellPositionX: 0
        },
        output: {
            leftEndPositionX: -55 * (settings.output.numCells / 2),
            rightEndPositionX: 55 * (settings.output.numCells / 2),
            currentCellNum: settings.output.numCells / 2,
            leftMostCellNum: 0,
            rightMostCellNum: settings.output.numCells-1,
            leftMostCellPositionX: 0,
            rightMostCellPositionX: 0
        },
        input: {
            leftEndPositionX: -55 * (settings.input.numCells / 2),
            rightEndPositionX: 55 * (settings.input.numCells / 2),
            currentCellNum: settings.input.numCells / 2,
            leftMostCellNum: 0,
            rightMostCellNum: settings.input.numCells-1,
            leftMostCellPositionX: 0,
            rightMostCellPositionX: 0,
            inputPointer: inputPointer
        }
    };
}

function stopAllAnimations() {
    TWEEN.removeAll();
}

function showRunConfig() {
    editor.setValue(rawCode);
    editor.focus();
    inputElement.value = input;
    runConfigOverlayElement.style.display = 'block';
    editor.refresh();
}

function hideRunConfig() {
    runConfigOverlayElement.style.display = 'none';
}

function showInfo() {
    infoOverlayElement.style.display = 'block';
}

function hideInfo() {
    infoOverlayElement.style.display = 'none';
}

function showInfoPage(pageNum) {
    var page = document.getElementById("info_page_" + pageNum);
    page.style.display = 'block';
    previousPageElement.classList.toggle('button-disabled', (pageNum == 1));
    nextPageElement.classList.toggle('button-disabled', (pageNum == MAX_INFO_PAGES));
}

function hideInfoPage(pageNum) {
    var page = document.getElementById("info_page_" + pageNum);
    page.style.display = 'none';
}

function previousInfoPage() {
    if (infoPageNum == 1) {
        return;
    }
    hideInfoPage(infoPageNum);
    showInfoPage(--infoPageNum);
}

function nextInfoPage() {
    if (infoPageNum == MAX_INFO_PAGES) {
        return;
    }
    hideInfoPage(infoPageNum);
    showInfoPage(++infoPageNum);
}

function reset(newRawCode, newInput) {
    stopAllAnimations();

    // Reset code execution with altered program/input
    if (newRawCode != undefined) {
        rawCode = newRawCode;
        code = extractBFCommands(newRawCode);
    }
    if (newInput != undefined) {
        input = newInput;
    }
    showCurrentCommand("");
    resetProgramState();
    resetAnimState();
    resetCells();
    resetBullet();

    resetPlayerControls();
}

function applyRunConfig() {
    reset(editor.getValue(), inputElement.value);

    hideRunConfig();

    nextCommand();
}


// ************* Enable/Disable Player Controls *************

function resetPlayerControls() {
    playerState.isReset = true;
    playerState.isRunning = false;
    playerState.isStepping = false;

    disableResetControl();
    enableToggleRunControl();
    enableStepControl();

    updateRunToggleIcon();
}

function ensureResetControlIsEnabled() {

    if (playerState.isReset) {
        playerState.isReset = false;
        // enable reset control
        resetElement.classList.toggle('toolbar-icon-disabled', false);
        resetElement.addEventListener("click", resetClickHandler);
    }
}

function disableResetControl() {
    resetElement.classList.toggle('toolbar-icon-disabled', true);
    resetElement.removeEventListener("click", resetClickHandler);
}

function updateRunToggleIcon() {
    runToggleElement.classList.toggle('run', !playerState.isRunning);
    runToggleElement.classList.toggle('pause', playerState.isRunning);
}

function enableRunAndStepControls() {
    enableToggleRunControl();
    enableStepControl();
}

function disableRunAndStepControls() {
    disableToggleRunControl();
    disableStepControl();
}

function enableToggleRunControl() {
    runToggleElement.classList.toggle('toolbar-icon-disabled', false);
    runToggleElement.addEventListener("click", toggleRunClickHandler);
}

function disableToggleRunControl() {
    runToggleElement.classList.toggle('toolbar-icon-disabled', true);
    runToggleElement.removeEventListener("click", toggleRunClickHandler);
}

function enableStepControl() {
    stepElement.classList.toggle('toolbar-icon-disabled', false);
    stepElement.addEventListener("click", stepClickHandler);
}

function disableStepControl() {
    stepElement.classList.toggle('toolbar-icon-disabled', true);
    stepElement.removeEventListener("click", stepClickHandler);
}


// ************* Player Control Click Handlers *************

// Note: wrapping reset() for use as a click handler so that event arguments are not passed to the reset() function
function resetClickHandler() {
    reset();
}

function toggleRunClickHandler() {

    ensureResetControlIsEnabled();

    // toggle run/pause control
    playerState.isRunning = !playerState.isRunning;
    updateRunToggleIcon();

    // enable/disable step control
    if (playerState.isRunning) {
        disableStepControl();
    } else {
        enableStepControl();
    }

    nextCommand();
}

function stepClickHandler() {

    ensureResetControlIsEnabled();

    playerState.isStepping = true;

    disableRunAndStepControls();

    var isStep = true;
    nextCommand(isStep);
}

function speedInputHandler() {
    ANIM_TIME = 1110 - (speedInputElement.value * 100);
    speedDisplayElement.innerHTML = speedInputElement.value;
}

function presetProgramChangeHandler() {
    var presetProgram = presetPrograms[presetProgramElement.value];

    reset(presetProgram.rawCode, presetProgram.input);
}

// ************* Init *************

function init() {

    resetProgramState();
    resetAnimState();

    // SETTINGS

    var runConfigElement = document.getElementById('run_config');
    runConfigElement.addEventListener("click", showRunConfig);

    var runConfigOkButton = document.getElementById('run_config_ok');
    runConfigOkButton.addEventListener("click", applyRunConfig);

    var runConfigCancelButton = document.getElementById('run_config_cancel');
    runConfigCancelButton.addEventListener("click", hideRunConfig);

    runConfigOverlayElement = document.getElementById('run_config_overlay');
    programElement = document.getElementById('program');
    inputElement = document.getElementById('input_values');

    editor = CodeMirror.fromTextArea(programElement, {
        lineNumbers: true,
        matchBrackets: true,
        mode: "text/x-brainfuck"
    });

    // INFO

    var infoElement = document.getElementById('info');
    infoElement.addEventListener("click", showInfo);

    var infoCloseElement = document.getElementById('info_close');
    infoCloseElement.addEventListener("click", hideInfo);

    infoOverlayElement = document.getElementById('info_overlay');

    previousPageElement = document.getElementById('previous_page');
    previousPageElement.addEventListener("click", previousInfoPage);

    nextPageElement = document.getElementById('next_page');
    nextPageElement.addEventListener("click", nextInfoPage);

    showInfoPage(infoPageNum);

    // PLAYER CONTROLS

    presetProgramElement = document.getElementById('preset_program');
    for (var presetNum=0; presetNum<presetPrograms.length; presetNum++) {
        var presetProgram = presetPrograms[presetNum];
        presetProgramElement.options[presetProgramElement.options.length] = new Option(presetProgram.name, presetNum, true, (presetNum === DEFAULT_PRESET_NUM));
    }
    presetProgramElement.addEventListener("change", presetProgramChangeHandler);

    resetElement = document.getElementById('reset');
    runToggleElement = document.getElementById('runToggle');
    stepElement = document.getElementById('step');
    enableToggleRunControl();
    enableStepControl();

    speedInputElement = document.getElementById('speed_input');
    speedDisplayElement = document.getElementById('speed_display');
    speedDisplayElement.innerHTML = 6;
    speedInputElement.value = 6;
    speedInputElement.addEventListener("input", speedInputHandler);

    // CURRENT COMMAND

    currentCommandElement = document.getElementById('current_command');


    // CONTAINER

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // CAMERA

    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 2500 );
    camera.position.set( settings.camera.position.x, settings.camera.position.y, settings.camera.position.z );
    cameraTarget = new THREE.Vector3( settings.camera.target.x, settings.camera.target.y, settings.camera.target.z );

    // SCENE

    fog = new THREE.Fog( settings.fog.colour, settings.fog.near, settings.fog.far );

    scene = new THREE.Scene();
    scene.position.y = -20;

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

    // TEXT MATERIALS

    memFrontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour, shading: THREE.FlatShading } );
    memSideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour, shading: THREE.SmoothShading } );
    memoryTextMaterial = new THREE.MeshFaceMaterial( [ memFrontTextMaterial, memSideTextMaterial ] );

    outputFrontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.output.textColour, shading: THREE.FlatShading } );
    outputSideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.output.textColour, shading: THREE.SmoothShading } );
    outputTextMaterial = new THREE.MeshFaceMaterial( [ outputFrontTextMaterial, outputSideTextMaterial ] );

    inputFrontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.input.textColour, shading: THREE.FlatShading } );
    inputSideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.input.textColour, shading: THREE.SmoothShading } );
    inputTextMaterial = new THREE.MeshFaceMaterial( [ inputFrontTextMaterial, inputSideTextMaterial ] );

    programFrontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.textColour, shading: THREE.FlatShading } );
    programSideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.textColour, shading: THREE.SmoothShading } );
    programTextMaterial = new THREE.MeshFaceMaterial( [ programFrontTextMaterial, programSideTextMaterial ] );

    cmdMaterial = {
        '>' : memoryTextMaterial,
        '<' : memoryTextMaterial,
        '+' : memoryTextMaterial,
        '-' : memoryTextMaterial,
        '.' : outputTextMaterial,
        ',' : inputTextMaterial,
        '[' : programTextMaterial,
        ']' : programTextMaterial
    };

    // LABEL TEXT MATERIALS

    var labelFrontTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.labels.textColour, shading: THREE.FlatShading } );
    var labelSideTextMaterial = new THREE.MeshPhongMaterial( {
        color: settings.labels.textColour, shading: THREE.SmoothShading } );
    var labelTextMaterial = new THREE.MeshFaceMaterial( [ labelFrontTextMaterial, labelSideTextMaterial ] );

    // FLOOR

    floorMaterial = new THREE.MeshBasicMaterial( {
        color: settings.floor.colour, transparent: false
    } );
    var floor = createPlane(floorMaterial);
    floor.visible = settings.render.floor;

    // MEMORY LABEL

    var memoryLabelMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour } );
    memoryLabel = createLabel( memoryLabelMaterial, labelTextMaterial, "MEMORY" );
    memoryLabel.position.x = animState.memory.leftEndPositionX + 100;
    memoryLabel.position.y = 410;
    
    // MEMORY POINTER
    var memoryPointerMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour } );
    var memoryPointerMarker = createPointer( memoryPointerMaterial );
    memoryPointerMarker.position.y = 350;
    
    // MEMORY

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

    memoryGroup.position.y = 350;

    // MEMORY ENDS

    var memBoxEndsMaterial = new THREE.MeshPhongMaterial( {
        color: settings.memory.textColour } );
    var leftMemEnd = createEndCell( memBoxEndsMaterial );
    leftMemEnd.position.setX(animState.memory.leftEndPositionX);
    leftMemEnd.position.setY(375);
    var rightMemEnd = createEndCell( memBoxEndsMaterial );
    rightMemEnd.position.setX(animState.memory.rightEndPositionX);
    rightMemEnd.position.setY(375);

    // PROGRAM LABEL

    var programLabelMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.textColour } );
    programLabel = createLabel( programLabelMaterial, labelTextMaterial, "PROGRAM" );
    programLabel.position.x = animState.program.leftEndPositionX + 100;
    programLabel.position.y = 235;

    // PROGRAM

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
        programCellGroup.add(createProgramText(command));
        programCellGroup.add( createBox( programBoxMaterial ) );
        programCellGroup.position.x = 55 * (cellNum - programCellOffset);

        programGroup.add(programCellGroup);
    }
    animState.program.rightMostCellPositionX = programCellGroup.position.x;

    programGroup.position.z = 0;
    programGroup.position.x = 0;
    programGroup.position.y = 175;

    // PROGRAM ENDS

    var programBoxEndsMaterial = new THREE.MeshPhongMaterial( {
        color: settings.program.textColour } );
    var leftProgramEnd = createEndCell( programBoxEndsMaterial );
    leftProgramEnd.position.setX(animState.program.leftEndPositionX);
    leftProgramEnd.position.setZ(0);
    leftProgramEnd.position.setY(200);
    var rightProgramEnd = createEndCell( programBoxEndsMaterial );
    rightProgramEnd.position.setX(animState.program.rightEndPositionX);
    rightProgramEnd.position.setZ(0);
    rightProgramEnd.position.setY(200);

    // OUTPUT LABEL

    var outputLabelMaterial = new THREE.MeshPhongMaterial( {
        color: settings.output.textColour } );
    outputLabel = createLabel( outputLabelMaterial, labelTextMaterial, "OUTPUT" );
    outputLabel.position.x = animState.output.leftEndPositionX + 100;
    outputLabel.position.y = 585;

    // OUTPUT POINTER
    var outputPointerMaterial = new THREE.MeshPhongMaterial( {
        color: settings.output.textColour } );
    var outputPointerMarker = createPointer( outputPointerMaterial );
    outputPointerMarker.position.y = 525;

    // OUTPUT

    outputBoxMaterial = new THREE.MeshPhongMaterial( {
        color: settings.output.cellColour, opacity: settings.output.cellOpacity, transparent: true } );

    outputGroup = new THREE.Group();

    var outputCellOffset = (settings.output.numCells / 2);
    animState.output.leftMostCellPositionX = 55 * (-outputCellOffset);
    var outputCellGroup;
    for (cellNum=0; cellNum<settings.output.numCells; cellNum++) {
        outputCellGroup = new THREE.Group();
        outputCellGroup.name = "outputCellGroup" + cellNum;
        outputCellGroup.add( createText( "outputText", "", outputTextMaterial ) );
        outputCellGroup.add( createBox( outputBoxMaterial ) );
        outputCellGroup.position.x = 55 * (cellNum - outputCellOffset);

        outputGroup.add(outputCellGroup);
    }
    animState.output.rightMostCellPositionX = outputCellGroup.position.x;

    outputGroup.position.x = 0;
    outputGroup.position.y = 525;

    // OUTPUT ENDS

    var outputBoxEndsMaterial = new THREE.MeshPhongMaterial( {
        color: settings.output.textColour } );
    var leftOutputEnd = createEndCell( outputBoxEndsMaterial );
    leftOutputEnd.position.setX(animState.output.leftEndPositionX);
    leftOutputEnd.position.setY(550);
    var rightOutputEnd = createEndCell( outputBoxEndsMaterial );
    rightOutputEnd.position.setX(animState.output.rightEndPositionX);
    rightOutputEnd.position.setY(550);

    // INPUT LABEL

    var inputLabelMaterial = new THREE.MeshPhongMaterial( {
        color: settings.input.textColour } );
    inputLabel = createLabel( inputLabelMaterial, labelTextMaterial, "INPUT" );
    inputLabel.position.x = animState.input.leftEndPositionX + 100;
    inputLabel.position.y = 55;

    // INPUT POINTER
    var inputPointerMaterial = new THREE.MeshPhongMaterial( {
        color: settings.input.textColour } );
    var inputPointerMarker = createPointer( inputPointerMaterial );
    inputPointerMarker.position.y = 0;
    
    // INPUT

    inputBoxMaterial = new THREE.MeshPhongMaterial( {
        color: settings.input.cellColour, opacity: settings.input.cellOpacity, transparent: true } );

    inputGroup = new THREE.Group();

    var inputCellOffset = (settings.input.numCells / 2);
    animState.input.leftMostCellPositionX = 55 * (-inputCellOffset);
    var inputCellGroup;
    for (cellNum=0; cellNum<settings.input.numCells; cellNum++) {
        var ip = cellNum - inputCellOffset;
        var inputText = (ip < 0 || ip >= input.length ? "" : input[ip]);
        inputCellGroup = new THREE.Group();
        inputCellGroup.name = "inputCellGroup" + cellNum;
        inputCellGroup.add( createText( "inputText", inputText, inputTextMaterial ) );
        inputCellGroup.add( createBox( inputBoxMaterial ) );
        inputCellGroup.position.x = 55 * (cellNum - inputCellOffset);

        inputGroup.add(inputCellGroup);
    }
    animState.input.rightMostCellPositionX = inputCellGroup.position.x;

    inputGroup.position.x = 0;
    inputGroup.position.y = 0;

    // INPUT ENDS

    var inputBoxEndsMaterial = new THREE.MeshPhongMaterial( {
        color: settings.input.textColour } );
    var leftInputEnd = createEndCell( inputBoxEndsMaterial );
    leftInputEnd.position.setX(animState.input.leftEndPositionX);
    leftInputEnd.position.setY(25);
    var rightInputEnd = createEndCell( inputBoxEndsMaterial );
    rightInputEnd.position.setX(animState.input.rightEndPositionX);
    rightInputEnd.position.setY(25);

    // COMMAND TEXT

    var numCommands = commands.length;
    for (var i=0; i<numCommands; i++) {
        var cmd = commands[i];
        var cmdText = createCommandText(cmd);
        cmdText.position.y = 60;
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
    gunGroup.position.z = 0;
    gunGroup.position.y = 170;

    // GROUP

    group = new THREE.Group();
    group.add(floor);

    group.add(memoryLabel);
    group.add(memoryPointerMarker);
    group.add(leftMemEnd);
    group.add(memoryGroup);
    group.add(rightMemEnd);

    group.add(gunGroup);

    group.add(programLabel);
    group.add(leftProgramEnd);
    group.add(programGroup);
    group.add(rightProgramEnd);

    group.add(outputLabel);
    group.add(outputPointerMarker);
    group.add(leftOutputEnd);
    group.add(outputGroup);
    group.add(rightOutputEnd);

    group.add(inputLabel);
    group.add(inputPointerMarker);
    group.add(leftInputEnd);
    group.add(inputGroup);
    group.add(rightInputEnd);

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
    renderer.sortObjects = true;
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

    var gui = new dat.GUI({ autoPlace: false });
    gui.close();
    var guiContainer = document.getElementById('gui_container');
    guiContainer.appendChild(gui.domElement);

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

    var outputFolder = gui.addFolder("Output");
    outputFolder.addColor(settings.output, 'cellColour').name("cell colour").onChange(function(value){
        outputBoxMaterial.color.setStyle(value);
    });
    outputFolder.add(settings.output, 'cellOpacity', 0, 1).name("cell opacity").onChange(function(value){
        outputBoxMaterial.opacity = value;
    });
    outputFolder.addColor(settings.output, 'textColour').name("text colour").onChange(function(value){
        outputFrontTextMaterial.color.setStyle(value);
        outputSideTextMaterial.color.setStyle(value);
    });

    var inputFolder = gui.addFolder("Input");
    inputFolder.addColor(settings.input, 'cellColour').name("cell colour").onChange(function(value){
        inputBoxMaterial.color.setStyle(value);
    });
    inputFolder.add(settings.input, 'cellOpacity', 0, 1).name("cell opacity").onChange(function(value){
        inputBoxMaterial.opacity = value;
    });
    inputFolder.addColor(settings.input, 'textColour').name("text colour").onChange(function(value){
        inputFrontTextMaterial.color.setStyle(value);
        inputSideTextMaterial.color.setStyle(value);
    });

    var labelsFolder = gui.addFolder("Labels");
    labelsFolder.addColor(settings.labels, 'textColour').name("text colour").onChange(function(value){
        labelFrontTextMaterial.color.setStyle(value);
        labelSideTextMaterial.color.setStyle(value);
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
    cameraPositionFolder.add(settings.camera.position, 'z', 500, 2000).onChange(function(value){
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
        memoryPointerMarker.visible = value;
        leftMemEnd.visible = value;
        memoryGroup.visible = value;
        rightMemEnd.visible = value;
    });
    renderFolder.add(settings.render, 'gun').onChange(function(value){
        gunGroup.visible = value;
    });
    renderFolder.add(settings.render, 'program').onChange(function(value){
        leftProgramEnd.visible = value;
        programGroup.visible = value;
        rightProgramEnd.visible = value;
    });
    renderFolder.add(settings.render, 'output').onChange(function(value){
        outputPointerMarker.visible = value;
        leftOutputEnd.visible = value;
        outputGroup.visible = value;
        rightOutputEnd.visible = value;
    });
    renderFolder.add(settings.render, 'input').onChange(function(value){
        inputPointerMarker.visible = value;
        leftInputEnd.visible = value;
        inputGroup.visible = value;
        rightInputEnd.visible = value;
    });
    renderFolder.add(settings.render, 'labels').onChange(function(value){
        outputLabel.visible = value;
        memoryLabel.visible = value;
        programLabel.visible = value;
        inputLabel.visible = value;
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
    floorMaterial.needsUpdate = true;
    memBoxMaterial.needsUpdate = true;
    memFrontTextMaterial.needsUpdate = true;
    memSideTextMaterial.needsUpdate = true;
    gunMaterial.needsUpdate = true;
    programBoxMaterial.needsUpdate = true;
    programFrontTextMaterial.needsUpdate = true;
    programSideTextMaterial.needsUpdate = true;
    outputBoxMaterial.needsUpdate = true;
    outputFrontTextMaterial.needsUpdate = true;
    outputSideTextMaterial.needsUpdate = true;
    inputBoxMaterial.needsUpdate = true;
    inputFrontTextMaterial.needsUpdate = true;
    inputSideTextMaterial.needsUpdate = true;
}

function createLabel(boxMaterial, textMaterial, text) {
    var geometry = new THREE.BoxGeometry( 250, 50, 10 );
    var labelBox = new THREE.Mesh( geometry, boxMaterial );
    labelBox.position.y = 25;
    var labelText = createText( "labelText", text, textMaterial );
    labelText.position.y = 17;

    var labelGroup = new THREE.Group();
    labelGroup.position.x = -400;
    labelGroup.add(labelBox);
    labelGroup.add(labelText);
    return labelGroup;
}

function createPointer(material) {
    var geometry = new THREE.BoxGeometry( 50, 10, 50 );
    var upperBox = new THREE.Mesh( geometry, material );
    upperBox.position.y = 55;
    var lowerBox = new THREE.Mesh( geometry, material );
    lowerBox.position.y = -5;

    var group = new THREE.Group();
    group.add(upperBox);
    group.add(lowerBox);
    return group;}

function createPlane(material) {
    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 10000, 10000 ),
        material
    );
    plane.position.y = -10;
    plane.rotation.x = - Math.PI / 2;
    return plane;
}

function createCommandText(cmd) {
    return createText("cmdText_" + cmd, cmd, getCommandMaterial(cmd));
}

function createProgramText(cmd) {
    return createText("programText", cmd, getCommandMaterial(cmd));
}

function getCommandMaterial(cmd) {
    return cmdMaterial[cmd] || programTextMaterial;
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

function createEndCell(material) {

    var geometry = new THREE.BoxGeometry( 52, 52, 52 );
    var box = new THREE.Mesh( geometry, material );
    box.position.y = 26;
    return box;
}

function createGunBox(material) {

    var geometry = new THREE.BoxGeometry( 30, 30, 30 );
    var box = new THREE.Mesh( geometry, material );
    box.position.y = 25;
    return box;
}

function createGunBarrel(material) {

    var geometry = new THREE.BoxGeometry( 10, 20, 10 );
    var box = new THREE.Mesh( geometry, material );
    box.position.y = 50;
    box.position.z = 0;
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

function showCurrentCommand(cmd) {
    currentCommandElement.innerText = cmd || "";
}

function nextCommand(isStep) {

    if (playerState.isStepping && !isStep) {
        // finish stepping
        playerState.isStepping = false;
        enableRunAndStepControls();
        return;
    }

    if (!playerState.isRunning && !isStep) {
        return;
    }

    codePointer++;

    if (codePointer >= codeSize) {
        disableRunAndStepControls();
        animateProgramToTheLeft(showCurrentCommand);
        return;
    }

    animateProgramToTheLeft(processCommand);
}

function processCommand() {

    var cmd = code[codePointer], prevCodePointer, times;

    showCurrentCommand(cmd);

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

                animateProgramToTheLeft(nextCommand, times);

            } else {

                nextCommand();
            }
            break;

        case ']':
            prevCodePointer = codePointer;

            codePointer = loopIn[codePointer];

            times = prevCodePointer - codePointer;

            animateProgramToTheRight(processCommand, times);
            break;

        case ',':
            var inputValue = input.charCodeAt(inputPointer) || 0;

            memory[memoryPointer] = inputValue;

            if (inputValue > 0) {
                inputPointer++;
                fireCommandBullet(cmd, animateInputValue);
            } else {
                fireCommandBullet(cmd, animateMemoryValueChanged);
            }
            break;

        case '.':
            output += (!memory[memoryPointer]) ? " " : String.fromCharCode(memory[memoryPointer]);

            fireCommandBullet(cmd, animateNewOutputValue);
            break;
    }
}

function fireCommandBullet(cmd, onCompleteCallback) {
    currentCommandText = commandTexts[cmd];
    currentCommandText.position.setY(60);
    gunGroup.add(currentCommandText);
    animState.commandBulletPosition.y = 60;
    var bulletTween = new TWEEN.Tween( animState.commandBulletPosition )
        .to( { y: 175 }, ANIM_TIME )
        .onUpdate( function () {
            currentCommandText.position.setY(this.y);
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

function incrementOutputCellNumWithWrap(cellNum) {
    return incrementCellNumWithWrap(cellNum, settings.output.numCells);
}

function incrementInputCellNumWithWrap(cellNum) {
    return incrementCellNumWithWrap(cellNum, settings.input.numCells);
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
        .to( { x: "-55" }, ANIM_TIME )
        .onUpdate( function () {
            memoryGroup.position.setX(this.x);
        } )
        .onComplete(nextCommand)
        .start();
}

function nextProgramCellLeft() {

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

        var newProgramText = createProgramText(nextShownProgramValue);
        nextCell.remove(programText);
        nextCell.add(newProgramText);
        nextCell.position.setX(animState.program.rightMostCellPositionX);
    }
}

function createTweenAnimateProgramLeft() {

    var programTween = new TWEEN.Tween( animState.programGroupPosition )
        .to( { x: "-55" }, ANIM_TIME )
        .onStart(nextProgramCellLeft)
        .onUpdate( function () {
            programGroup.position.setX(this.x);
        } );
    return programTween;
}

function setupAndStartChainedTweens(createTweenFn, onCompleteFn, times) {

    var tweens = {}, i, numTweens = times || 1;

    // create tweens
    for (i=0; i<numTweens; i++) {
        tweens[i] = createTweenFn();
    }
    // chain tweens
    for (i=1; i<numTweens; i++) {
        tweens[i-1].chain(tweens[i]);
    }

    if (onCompleteFn) {
        tweens[numTweens-1].onComplete(onCompleteFn);
    }
    tweens[0].start();
}

function animateProgramToTheLeft(onCompleteFn, times) {

    setupAndStartChainedTweens(createTweenAnimateProgramLeft, onCompleteFn, times);
}

function nextProgramCellRight() {

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

        var newProgramText = createProgramText(nextShownProgramValue);
        nextCell.remove(programText);
        nextCell.add(newProgramText);
        nextCell.position.setX(animState.program.leftMostCellPositionX);
    }
}

function createTweenAnimateProgramRight() {
    var programTween = new TWEEN.Tween( animState.programGroupPosition )
        .to( { x: "+55" }, ANIM_TIME )
        .onStart(nextProgramCellRight)
        .onUpdate( function () {
            programGroup.position.setX(this.x);
        } );
    return programTween;
}

function animateProgramToTheRight(onCompleteFn, times) {

    setupAndStartChainedTweens(createTweenAnimateProgramRight, onCompleteFn, times);
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
        .to( { x: "+55" }, ANIM_TIME )
        .onUpdate( function () {
            memoryGroup.position.setX(this.x);
        } )
        .onComplete(nextCommand)
        .start();
}

function updateCurrentMemoryCellText() {
    var memCellGroup = scene.getObjectByName("memoryCellGroup" + animState.memory.currentCellNum);
    var memText = memCellGroup.getObjectByName("memoryText");

    var newMemText = createText("memoryText", memory[memoryPointer], memoryTextMaterial);
    memCellGroup.remove(memText);
    memCellGroup.add(newMemText);
}

function animateMemoryValueChanged() {
    updateCurrentMemoryCellText();
    nextCommand();
}

function animateOutputToTheLeft() {

    var rightMostCell = scene.getObjectByName("outputCellGroup" + animState.output.rightMostCellNum);
    if (animState.outputGroupPosition.x + rightMostCell.position.x != animState.output.rightEndPositionX) {

        // Setup the next output cell ready to be scrolled into the output view from the right
        animState.output.leftMostCellNum = incrementOutputCellNumWithWrap(animState.output.leftMostCellNum);
        animState.output.rightMostCellNum = incrementOutputCellNumWithWrap(animState.output.rightMostCellNum);

        animState.output.leftMostCellPositionX += 55;
        animState.output.rightMostCellPositionX += 55;

        var nextCell = scene.getObjectByName("outputCellGroup" + animState.output.rightMostCellNum);
        var outputText = nextCell.getObjectByName("outputText");

        var newOutputText = createText( "outputText", "", outputTextMaterial );
        nextCell.remove(outputText);
        nextCell.add(newOutputText);
        nextCell.position.setX(animState.output.rightMostCellPositionX);
    }
    animState.output.currentCellNum = incrementOutputCellNumWithWrap(animState.output.currentCellNum);

    // Move output group
    var outputTween = new TWEEN.Tween( animState.outputGroupPosition )
        .to( { x: "-55" }, ANIM_TIME )
        .onUpdate( function () {
            outputGroup.position.setX(this.x);
        } )
        .onComplete(nextCommand)
        .start();
}

function animateNewOutputValue() {
    var outputCellGroup = scene.getObjectByName("outputCellGroup" + animState.output.currentCellNum);
    var outputText = outputCellGroup.getObjectByName("outputText");

    var newOutputText = createText( "outputText", output[output.length-1], outputTextMaterial );
    outputCellGroup.remove(outputText);
    outputCellGroup.add(newOutputText);

    animateOutputToTheLeft();
}

function animateInputToTheLeft() {

    animState.input.inputPointer++;

    var rightMostCell = scene.getObjectByName("inputCellGroup" + animState.input.rightMostCellNum);
    if (animState.inputGroupPosition.x + rightMostCell.position.x != animState.input.rightEndPositionX) {

        // Setup the next input cell ready to be scrolled into the input view from the right
        animState.input.leftMostCellNum = incrementInputCellNumWithWrap(animState.input.leftMostCellNum);
        animState.input.rightMostCellNum = incrementInputCellNumWithWrap(animState.input.rightMostCellNum);

        animState.input.leftMostCellPositionX += 55;
        animState.input.rightMostCellPositionX += 55;

        var nextCell = scene.getObjectByName("inputCellGroup" + animState.input.rightMostCellNum);
        var inputText = nextCell.getObjectByName("inputText");

        var nextShownInputPointer = animState.input.inputPointer + (settings.input.numCells / 2) - 1;
        var nextShownInputValue = nextShownInputPointer < input.length ? input[nextShownInputPointer] : "";

        var newInputText = createText( "inputText", nextShownInputValue, inputTextMaterial );
        nextCell.remove(inputText);
        nextCell.add(newInputText);
        nextCell.position.setX(animState.input.rightMostCellPositionX);
    }
    animState.input.currentCellNum = incrementInputCellNumWithWrap(animState.input.currentCellNum);

    // Move input group
    var inputTween = new TWEEN.Tween( animState.inputGroupPosition )
        .to( { x: "-55" }, ANIM_TIME )
        .onUpdate( function () {
            inputGroup.position.setX(this.x);
        } )
        .onComplete(nextCommand)
        .start();
}

function animateInputValue() {
    updateCurrentMemoryCellText();

    animateInputToTheLeft();
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
