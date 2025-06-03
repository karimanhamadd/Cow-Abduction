var canvas;
var gl;
var program;
var near = 1;
var far = 100;
var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;
var lightPosition = vec4(100.0, 100.0, 100.0, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 1.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 40.0;
var ambientColor, diffuseColor, specularColor;
var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye = vec3(0, 0, 10);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0;
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = true;
var controller;



var applytexture = 0;
var tint = 0;

// For this example we are going to store a few different textures here
var textureArray = [];

// Setting the colour which is needed during illumination of a surface
function setColor(c) {
  ambientProduct = mult(lightAmbient, c);
  diffuseProduct = mult(lightDiffuse, c);
  specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
  if (im.complete) {
    console.log("loaded");
    return true;
  } else {
    console.log("still not loaded!!!!");
    return false;
  }
}

// Helper function to load an actual file as a texture

function loadFileTexture(tex, filename) {
  //create and initalize a webgl texture object.
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();
  tex.image.src = filename;
  tex.isTextureReady = false;
  tex.image.onload = function () {
    handleTextureLoaded(tex);
  };
}


function handleTextureLoaded(textureObj) {
  gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    textureObj.image
  );

  //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_NEAREST
  );

  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.GL_REPEAT); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.GL_REPEAT); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);
  console.log(textureObj.image.src);

  textureObj.isTextureReady = true;
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually laoded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
  setTimeout(function () {
    var n = 0;
    for (var i = 0; i < texs.length; i++) {
      console.log(texs[i].image.src);
      n = n + texs[i].isTextureReady;
    }
    wtime = new Date().getTime();
    if (n != texs.length) {
      console.log(wtime + " not ready yet");
      waitForTextures(texs);
    } else {
      console.log("ready to render");
      render(0);
    }
  }, 5);
}

function loadImageTexture(tex, image) {
  //create and initalize a webgl texture object.
  tex.textureWebGL = gl.createTexture();
  tex.image = new Image();

  gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texSize,
    texSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.generateMipmap(gl.TEXTURE_2D);

  //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
  gl.bindTexture(gl.TEXTURE_2D, null);

  tex.isTextureReady = true;
}

function initTexturesForExample() {
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "Cloudy_Sky.png");

  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "grassimage.jpg");

  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "wood1.jpg");
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "toptree.jpg");
  textureArray.push({});
  loadFileTexture(textureArray[textureArray.length - 1], "moon.jpg");
}

// Turn texture use on and off
function putmytexture() {
  applytexture = (applytexture + 1) % 2;
  gl.uniform1i(gl.getUniformLocation(program, "applytexture"), applytexture);
}
//shader helper//caller function
function toggleTint(val) {
  tint = val;
  gl.uniform1i(gl.getUniformLocation(program, "tint"), tint);
}


window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);


  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  setColor(materialDiffuse);
  Cube.init(program);
  Sphere.init(36, program);
  Cylinder.init(20, program);
  Cone.init(20, program);



  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  initTexturesForExample();

  waitForTextures(textureArray);
};

function setMV() {
  modelViewMatrix = mult(viewMatrix, modelMatrix);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  normalMatrix = inverseTranspose(modelViewMatrix);
  gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}
function setAllMatrices() {
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  setMV();
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
  setMV();
  Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
  setMV();
  Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
  setMV();
  Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
  setMV();
  Cone.draw();
}

// Draw a Bezier patch
function drawB3(b) {
  setMV();
  b.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x, y, z) {
  modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta, x, y, z) {
  modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx, sy, sz) {
  modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
  modelMatrix = MS.pop();
}
function gPopN(n) {
  for (i = 0; i < n; i++) {
    gPop();
  }
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
  MS.push(modelMatrix);
}
let isBreaking = false;
let breakTime = 3;  // Time in seconds before the asteroid starts breaking
let timer = 0;  // Timer to track the elapsed time

function render(timestamp) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  MS = []; // Initialize modeling matrix stack

  // initialize the modeling matrix to identity
  modelMatrix = mat4();

  // set the camera matrix
  viewMatrix = lookAt(eye, at, up);

  // set the projection matrix
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  // set all the matrices
  setAllMatrices();

  if (animFlag) {
    dt = (timestamp - prevTime) / 1000.0;
    prevTime = timestamp;
    
  }
  timer += dt;

  let alienblinkblink = Math.abs(Math.sin(timestamp / 1000)); 
  
function renderalien() {
  let alienBob = 0.2* Math.sin(timestamp / 1000); 

  gTranslate(0, 0+alienBob, 0); 

  gPush();
  // Torso
  gScale(1.1, 1.1, 1.1);
  gPush();
      gTranslate(0,-0.4,0);
      setColor(vec4(0.0889, 0.440, 0.0704, 1.0));
      gScale(0.5, 0.75, 0.25); 
      drawSphere();
  gPop();

  // Neck
  gPush();
  {
      gTranslate(0.0, 0.2, -0.1); 
      gScale(0.13, 0.4, 0.13); 
      setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
      drawSphere();
  }
  gPop();
  
  // Head
  gPush();
  {
      gTranslate(0.0, 1, -0.25); 
      gRotate(10,1,1,1);
      gScale(0.55, 0.6, 0.55);
      setColor(vec4(0.0889, 0.440, 0.0704, 1.0));
      drawSphere();

      // Left Eye
      gPush();
      {
          gTranslate(0.35, 0, 1); 
          gRotate(40, 1, 1, 1);
          gScale(0.5, 0.3 * alienblinkblink, 0.3); 
          setColor(vec4(0.00525, 0.0100, 0.00500, 1.0)); 
          drawSphere();
      }
      gPop();

      // Right Eye
      gPush();
      {
          gTranslate(-0.7, 0, 1); 
          gRotate(-40, 1, 1, 1);
          gScale(0.5, 0.3 * alienblinkblink, 0.3); 
          setColor(vec4(0.00525, 0.0100, 0.00500, 1.0)); 
          drawSphere();
      }
      gPop();
  }
  gPop();

        gPush();
        {
            gTranslate(-0.6, -0.3, -0.375);  
            setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
            //gRotate(0, 1, 0, 0);
            gRotate(-30, 0, 1, 0);  
            gRotate(-45, 0, 0, 1);
            //gRotate(armAngle, 0, 0, 1);
            gScale(0.05, 0.4, 0.05);  
            drawCube();
        }
        gPop();

        gPush();
        {
          gTranslate(0.6, -0.3, -0.375);  
            setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
            gRotate(0, 1, 0, 0);
            gRotate(-30, 0, 1, 0);
            gRotate(45, 0, 0, 1);
            //Rotate(armAngle, 0, 0, 1);
            gScale(0.05, 0.4, 0.05);  
            drawCube();
        }
        gPop();


        gPush(); // The thigh first
        {
            gTranslate(-0.08, -1.4, -3); 
            setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
            gRotate(15, 1, 0, 0);
            gRotate(-30, 0, 1, 0);
            gRotate(7, 0, 0, 1);
            gRotate(-1, 1, 0, 0);
            gPush();
            {
              gScale(0.05, 0.4, 0.05);  
                drawCube();
            }
            gPop();
        }
        gPop();
        gPush(); // Thigh #2
        {
            gTranslate(0.28, -1.2, -3);  
            setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
            gRotate(15, 1, 0, 0);
            gRotate(-30, 0, 1, 0); 
            gRotate(7, 0, 0, 1);
            gRotate(1, 1, 0, 0); 
            gPush();
            {
              gScale(0.05, 0.5, 0.05);  
                drawCube();
            }
            gPop();
        }
        gPop();
    gPop();
}


function renderalienfront() {
  let alienBob = 0.2* Math.sin(timestamp / 1000); 

  gTranslate(5.3, -1 + alienBob, 2); 
  gRotate(-23, 0, 0, 1);
  gScale(1.5, 1.5, 1.5);

  gPush();
  // Torso
  gScale(1.1, 1.1, 1.1);
  gPush();
      gTranslate(0,-0.4,0);
      setColor(vec4(0.0889, 0.440, 0.0704, 1.0));
      gScale(0.5, 0.75, 0.25); 
      drawSphere();
  gPop();

  // Neck
  gPush();
  {
      gTranslate(0.0, 0.2, -0.1); 
      gScale(0.13, 0.4, 0.13); 
      setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
      drawSphere();
  }
  gPop();
  
  // Head
  gPush();
  {
      gTranslate(0.0, 1, -0.25); 
      gRotate(10,1,1,1);
      gScale(0.55, 0.6, 0.55);
      setColor(vec4(0.0889, 0.440, 0.0704, 1.0));
      drawSphere();

      // Left Eye
      gPush();
      {
          gTranslate(0.35, 0, 1); 
          gRotate(40, 1, 1, 1);
          gScale(0.5, 0.3 * alienblinkblink, 0.3); 
          setColor(vec4(0.00525, 0.0100, 0.00500, 1.0)); 
          drawSphere();
      }
      gPop();

      // Right Eye
      gPush();
      {
          gTranslate(-0.7, 0, 1); 
          gRotate(-40, 1, 1, 1);
          gScale(0.5, 0.3 * alienblinkblink, 0.3); 
          setColor(vec4(0.00525, 0.0100, 0.00500, 1.0)); 
          drawSphere();
      }
      gPop();
  }
  gPop();
// Upper Arm Motion
let armAngle1 = 7 * Math.sin(1.9 * timestamp / 1000);  // Shoulder wave motion

// Upper Arm 
gPush();
{
    gTranslate(-0.4, -0.35, -0.375);  
    setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
    gRotate(-30, 0, 1, 0);  
    gRotate(-45 , 0, 0, 1); // Shoulder wave motion
    gScale(0.05, 0.4, 0.05);  
    drawCube();
}
gPop();

// Elbow 
/*
gPush();
{
    gTranslate(-0.89, -0.69, 4.1);  
    setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
    gScale(0.08, 0.08, 0.08); 
    drawSphere();
}
gPop();
*/

gPush();
{
  gTranslate(-0.8, -0.49, -0.375);  
    setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
    gRotate(50+(armAngle1*0.7), 0, 0, 1);  
    gScale(0.05, 0.25, 0.05);  
    drawCube();

    gTranslate(0.3, 1, -0.2);  
    gScale(1/0.05, 1/0.29, 1/0.05);
    gScale(0.13, 0.1, 0.1);
    drawSphere();
    gPush();
    // Fingers
    gTranslate(0.7, 1, -0.2); 
    gScale(1/0.13, 1/0.1, 1/0.1); 
    gRotate(-25,0,0,1)
    gScale(0.03, 0.23, 0.03);
    drawCube();
    gPop();
    gPush();
    gTranslate(-0.2, 1, -0.2); 
    gScale(0.3, 1.8, 0.3);
    gRotate(12,0,0,1)
    //gRotate(1/10,0,0,1)
    //gRotate(-10,0,0,1)
    drawCube();
    gPop();
}
gPop();



        gPush();
        {
          gTranslate(0.6, -0.3, -0.375);  
            setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
            gRotate(0, 1, 0, 0);
            gRotate(-30, 0, 1, 0);
            gRotate(45, 0, 0, 1);
            //Rotate(armAngle, 0, 0, 1);
            gScale(0.05, 0.4, 0.05);  
            drawCube();
        }
        gPop();

        gPush(); // The thigh first
        {
            gTranslate(0.25, -1.4, 0); 
            setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
            gRotate(15, 1, 0, 0);
            gRotate(-30, 0, 1, 0);
            gRotate(7, 0, 0, 1);
            gRotate(-1, 1, 0, 0);
            gPush();
            {
              gScale(0.05, 0.4, 0.05);  
                drawCube();
            }
            gPop();
            gPush(); // The foot of the same thigh 
            {
                gTranslate(0.2, -0.41, 0.1);  
                setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
                gRotate(28, 1, 0, 0);
                gScale(0.08, 0.01, 0.15);  
                drawSphere();
            }
            gPop();
        }
        gPop();
        gPush(); // Thigh #2
        {
            gTranslate(0.15, -1.2, -3);  
            setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
            gRotate(15, 1, 0, 0);
            gRotate(-30, 0, 1, 0); 
            gRotate(7, 0, 0, 1);
            gRotate(1, 1, 0, 0); 
            gPush();
            {
              gScale(0.05, 0.5, 0.05);  
                drawCube();
            }
            gPop();
        
            gPush(); 
            {
                gTranslate(0, -0.52, 0.1);  
                setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
                gRotate(30, 1, 0, 0);
                gScale(0.08, 0.01, 0.15);  
                drawSphere();
            }
            gPop();
        }
        gPop();
    gPop();
}

  function renderalien2() {

    gTranslate(-1.9,0,0);
    gPush();

    gScale(1.1, 1.1, 1.1);
    gPush();
        gTranslate(0,-0.4,0);
        setColor(vec4(0.0889, 0.440, 0.0704, 1.0));
        gScale(0.5, 0.75, 0.25); 
        drawSphere();
    gPop();
  
    // Neck
    gPush();
    {
        gTranslate(0.0, 0.2, -0.1); 
        gScale(0.13, 0.4, 0.13); 
        setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
        drawSphere();
    }
    gPop();
    
    // Head
    gPush();
    {
        gTranslate(0.0, 1, -0.25); 
        gRotate(10,1,1,1);
        gScale(0.55, 0.6, 0.55);
        setColor(vec4(0.0889, 0.440, 0.0704, 1.0));
        drawSphere();
  
        // Left Eye
        gPush();
        {
            gTranslate(0.35, 0, 1); 
            gRotate(40, 1, 1, 1);
            gScale(0.5, 0.3 * alienblinkblink, 0.3); 
            setColor(vec4(0.00525, 0.0100, 0.00500, 1.0)); 
            drawSphere();
        }
        gPop();
  
        // Right Eye
        gPush();
        {
            gTranslate(-0.7, 0, 1); 
            gRotate(-40, 1, 1, 1);
            gScale(0.5, 0.3 * alienblinkblink, 0.3); 
            setColor(vec4(0.00525, 0.0100, 0.00500, 1.0)); 
            drawSphere();
        }
        gPop();
    }
    gPop();

          gPush();
          {
              gTranslate(-0.6, -0.3, -0.375);  
              setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
              //gRotate(0, 1, 0, 0);
              gRotate(-30, 0, 1, 0);  
              gRotate(-45, 0, 0, 1);
              //gRotate(armAngle, 0, 0, 1);
              gScale(0.05, 0.4, 0.05);  
              drawCube();
          }
          gPop();
  
          gPush();
          {
            gTranslate(0.6, -0.3, -0.375);  
              setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
              gRotate(0, 1, 0, 0);
              gRotate(-30, 0, 1, 0);
              gRotate(45, 0, 0, 1);
              //Rotate(armAngle, 0, 0, 1);
              gScale(0.05, 0.4, 0.05);  
              drawCube();
          }
          gPop();

          gPush(); // The thigh first
          {
              gTranslate(-0.1, -1.4, -3); 
              setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
              gRotate(15, 1, 0, 0);
              gRotate(-30, 0, 1, 0);
              gRotate(7, 0, 0, 1);
              gRotate(-1, 1, 0, 0);
              gPush();
              {
                gScale(0.05, 0.4, 0.05);  
                  drawCube();
              }
              gPop();
              gPush(); // The foot of the same thigh 
              {
                  gTranslate(0, -0.41, 0.1);  
                  setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
                  gRotate(28, 1, 0, 0);
                  gScale(0.08, 0.01, 0.15);  
                  drawSphere();
              }
              gPop();
          }
          gPop();
          gPush(); // Thigh #2
          {
              gTranslate(0.3, -1.2, -3);  
              setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
              gRotate(15, 1, 0, 0);
              gRotate(-30, 0, 1, 0); 
              gRotate(7, 0, 0, 1);
              gRotate(1, 1, 0, 0); 
              gPush();
              {
                gScale(0.05, 0.5, 0.05);  
                  drawCube();
              }
              gPop();
          
              gPush(); 
              {
                  gTranslate(0, -0.52, 0.1);  
                  setColor(vec4(0.0889, 0.440, 0.0704, 1.0)); 
                  gRotate(30, 1, 0, 0);
                  gScale(0.08, 0.01, 0.15);  
                  drawSphere();
              }
              gPop();
          }
          gPop();
      gPop();
      
    }

  updateUFO(timestamp);
  updatePig(timestamp);
  openclosemout(timestamp)
  updateUFO2(timestamp);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
  

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture4"), 1);



if(timestamp>0 && timestamp<8500){
  scene1();
  ///360 call here
  if (timestamp > 900 && timestamp < 7900) {
    move360(eye, timestamp);
  }
}

if(timestamp>8500 && timestamp<20000){
  scene2();
}
if(timestamp>20000 && timestamp<39000){
  scene1();
}

  if (animFlag) window.requestAnimFrame(render);

  function scene1() {
    renderPig();
    renderdfloor();

    //DISCLAIMER: Thruthfully , i used Copilot to generate these for me 
    // as in i told it to plot flowers from --0.8 and the second val to be 
    //-6 to 0 then asked it to to the same for -2.5 and so on
    // I wrote the code for render Flowe but i used copilot as a faster 
    //way to call it with different values
    renderFlower(-0.8, 0);
    renderFlower(-0.8, -1);
    renderFlower(-0.8, -2);
    renderFlower(-0.8, -3);
    renderFlower(-0.8, -4);
    renderFlower(-0.8, -5);
    renderFlower(-0.8, -6);

    renderFlower(-2.5, 0);
    renderFlower(-2.5, -1);
    renderFlower(-2.5, -2);
    renderFlower(-2.5, -3);
    renderFlower(-2.5, -4);
    renderFlower(-2.5, -5);
    renderFlower(-2.5, -6);

    renderFlower(-4, 0);
    renderFlower(-4, -1);
    renderFlower(-4, -2);
    renderFlower(-4, -3);
    renderFlower(-4, -4);
    renderFlower(-4, -5);
    renderFlower(-4, -6);

    renderFlower(-5.4, 0);
    renderFlower(-5.4, -1);
    renderFlower(-5.4, -2);
    renderFlower(-5.4, -3);
    renderFlower(-5.4, -4);
    renderFlower(-5.4, -5);
    renderFlower(-5.4, -6);

    renderFlower(-7, 0);
    renderFlower(-7, -1);
    renderFlower(-7, -2);
    renderFlower(-7, -3);
    renderFlower(-7, -4);
    renderFlower(-7, -5);
    renderFlower(-7, -6);
    renderFlower(-6, -5);
    renderFlower(1, -6);
    renderFlower(1, -5);
    renderFlower(1, -4);
    renderFlower(1, -3);
    renderFlower(1, -2);
    renderFlower(1, -1);
    
    renderFlower(2, -6);
    renderFlower(2, -5);
    renderFlower(2, -4);
    renderFlower(2, -3);
    renderFlower(2, -2);
    renderFlower(2, -1);
    renderFlower(3, -6);
    renderFlower(3, -5);
    renderFlower(3, -4);
    renderFlower(3, -3);
    renderFlower(3, -2);
    renderFlower(3, -1);

    renderFlower(4, -6);
    renderFlower(4, -5);
    renderFlower(4, -4);
    renderFlower(4, -3);
    renderFlower(4, -2);
    renderFlower(4, -1);

    renderFlower(5.5, -6);
    renderFlower(5.5, -5);
    renderFlower(5.5, -4);
    renderFlower(5.5, -3);
    renderFlower(5.5, -2);
    renderFlower(5.5, -1);
    renderFlower(6.5, -6);
    renderFlower(6.5, -5);
    renderFlower(6.5, -4);
    renderFlower(6.5, -3);
    renderFlower(6.5, -2);
    renderFlower(6.5, -1);

    renderFlower(7.5, -6);
    renderFlower(7.5, -5);
    renderFlower(7.5, -4);
    renderFlower(7.5, -3);
    renderFlower(7.5, -2);
    renderFlower(7.5, -1);

    renderFlower(8.5, -6);
    renderFlower(8.5, -5);
    renderFlower(8.5, -4);
    renderFlower(8.5, -3);
    renderFlower(8.5, -2);
    renderFlower(8.5, -1);

    renderFlower(9.5, -6);
    renderFlower(9.5, -5);
    renderFlower(9.5, -4);
    renderFlower(9.5, -3);
    renderFlower(9.5, -2);
    renderFlower(9.5, -1);

    renderFlower(10.5, -6);
    renderFlower(10.5, -5);
    renderFlower(10.5, -4);
    renderFlower(10.5, -3);
    renderFlower(10.5, -2);
    renderFlower(10.5, -1);


    //renderHouse();
   // rendertree();
   // rendertreetop();
    //renderBird());
    renderbackground();
    if(timestamp>20000){
      //renderPig();
      renderUFO2(); 
  
    }

  }
  function scene2() {
    renderalienmoon();
    renderUFO();
    renderalien();
    renderalien2();
    renderalienfront()
    updateAndDrawStars(stars, dt);
}

}

const stars = starsinit(400);
let zPos = -9;
function starsinit(numStars) {
    const xPos =[];
    const yPos=[];
    const sizes= [];

    function randomRange(min, max) {
       
        return Math.random()*(max - min) + min;
    }
    for (let i=0;i<numStars;i++) {
        xPos.push(randomRange(-12,12)); 
        yPos.push(randomRange(-12,12));
        sizes.push(randomRange(0.02,0.1));
    }
    return { xPos, yPos, sizes };
}
function updateAndDrawStars(stars, dt) {
  toggleTint(1);
    const { xPos,yPos, sizes} = stars;

    for (let i = 0; i < xPos.length; i++) {
        xPos[i] +=dt*0.9;
        yPos[i] +=dt*0.9;
      
        if (xPos[i] > 6||yPos[i] >6) {
            xPos[i] -= 24; 
            yPos[i] -= 24;
        }
        setColor(vec4(1.0, 1.0,1.0,1.0));
        drawspher(xPos[i], yPos[i], sizes[i]);
    }
    toggleTint(0);
}
function drawspher(x, y, size) {
    gPush(); 
    gTranslate(x,y,zPos); 
    gScale(size,size,size); 
    drawSphere(); 
    gPop(); 
}

let moonRotation = 0; // Rotation angle

function renderalienmoon() {
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[4].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0); 

  
  gPush();
  {
    putmytexture();
    setColor(vec4(0.5, 0, 0.6, 1));
    gPush();
    {
      gTranslate(0, -8.5, 0);
      gScale(8.0, 7.0, 7.0);
      gRotate(moonRotation, 0, 1, 0); // 3otates around y-axis 
      drawSphere();
    }
    gPop();
    putmytexture();
  }
  gPop();
}

function updateAlienMoon() {
  moonRotation += 0.2; 
  if (moonRotation >= 360) {
    moonRotation -= 360; 
  }
}


function updateScene() {
  updateAlienMoon();
  requestAnimationFrame(updateScene); 
}
updateScene(); 


//to move the "world" 360 around what im seeing right now , which is 0,0,10 for the eye
function move360(eye, timestamp) {
    if (timestamp < 10000) {
      eye[0] = 10 * Math.cos(0.001 * timestamp);
      eye[2] = 10 * Math.sin(0.001 * timestamp);
    } else {
      eye = vec3(0, 4, 10);
    }
}

  function renderdfloor() {
    //so same as teh sky i am adding one in the front back left and right , 
    //not sure if this is the best way to do it but it works for now!
    gPush();
    {
      gTranslate(0, -7, 0);
      gPush();
      {
        gScale(25, 2, 25);
        putmytexture();
        drawCube();
        putmytexture();
      }
      gPop();

      gPush();
      {
        gTranslate(0, 0, 25);
        gScale(25, 2, 25);
        putmytexture();
        drawCube();
        putmytexture();
      }
      gPop();

      gPush();
      {
        gTranslate(0, 0, -25);
        gScale(25, 2, 25);
        putmytexture();
        drawCube();
        putmytexture();
      }
      gPop();
      gPush();
      {
        gTranslate(25, 0, 0);
        gScale(25, 2, 25);
        putmytexture();
        drawCube();
        putmytexture();
      }
      gPop();
      gPush();
      {
        gTranslate(-25, 0, 0);
        gScale(25, 2, 25);
        putmytexture();
        drawCube();
        putmytexture();
      }
      gPop();
    }
    gPop();
  }
let pigLift = 0; 
let PIGY = -3.5;
let shrinkpig = 1;
let updateskrink = 0.003;
let direction2 = 0.02;
let timeppig = 0.1;
let iterations = 50;
let piclose=0.5;
function renderPig() {
  gPush();
  gTranslate(3, PIGY, 0); 
  gScale(shrinkpig, shrinkpig, 1);
  
  // Body
  setColor(vec4(1.0, 0.6, 0.7, 1.0)); // Light pink
  gPush(); 
  {
    gScale(1.4, 0.9, 0.9);
    drawSphere();

    // Legs 
    setColor(vec4(0.9, 0.5, 0.6, 1.0));
    gPush(); 
    {
      gTranslate(-0.5, -1, 0.5);
      gScale(0.1, 0.7, 0.1);
      drawCube();
    } gPop();
    
    gPush(); 
    {
      gTranslate(0.5, -1, 0.5);
      gScale(0.1, 0.7, 0.1);
      drawCube();
    } gPop();
    
    gPush(); 
    {
      gTranslate(0.5, -1, -0.5);
      gScale(0.1, 0.7, 0.1);
      drawCube();
    } gPop();
    
    gPush(); 
    {
      gTranslate(-0.5, -1, -0.5);
      gScale(0.1, 0.7, 0.1);
      drawCube();
    } gPop();

    // Tail 
    gPush();
    {
      gTranslate(1, 0, 0); 
      gRotate(45, 0, 0, 1); // Angle it slightly
      setColor(vec4(0.9, 0.5, 0.6, 1.0)); // Darker pink
      gScale(0.1, 0.5, 0.1); 
      drawSphere();
    }
    gPop();
  } 
  gPop();

  // Head
  gPush(); 
  {      
    gTranslate(-1.8, 0.8, 0);
    setColor(vec4(1.0, 0.7, 0.8, 1.0));
    gScale(0.6, 0.6, 0.6);
    drawSphere();

    // Eyes (small black spheres)
    gPush();
    {
      gTranslate(-0.5, 0.2, 0.87); // Left eye
      setColor(vec4(0.0, 0.0, 0.0, 1.0)); 
      gScale(0.1, 0.1, 0.1);
      drawSphere();
    }
    gPop();
    gPush();
    {
      gTranslate(0.5, 0.2, 0.87); // Right eye
      setColor(vec4(0.0, 0.0, 0.0, 1.0));
      gScale(0.1, 0.1, 0.1);
      drawSphere();
    }
    gPop();

    // Mouth 
    gPush();
    {

      gTranslate(0, -0.2,0.8); 
      setColor(vec4(1.0, 0.0, 0.0, 1.0)); 
      gScale(0.4, 0.5*piclose, 0.2);
      drawSphere();
    }
    gPop();

    // Ears 
    gPush();
    {
      gTranslate(-0.3, 1, 0); // Left ear
      setColor(vec4(1.0, 0.6, 0.7, 1.0)); // Same as body
      gRotate(45, 0, 0, 1); 
      gScale(0.2, 0.3, 0.05); 
      drawCube();
    }
    gPop();
    gPush();
    {
      gTranslate(0.3, 1, 0); // Right ear
      setColor(vec4(1.0, 0.6, 0.7, 1.0));
      gRotate(-45, 0, 0, 1); 
      gScale(0.2, 0.3, 0.05);
      drawCube();
    }
    gPop();


    gPush();
    {
      gTranslate(1, -0.4, 0);
      setColor(vec4(1.0, 0.5, 0.6, 1.0));
      gRotate(50, 0, 0, 1);
      gScale(0.4, 0.7, 0.4);
      drawCube();
    }
    gPop();
  } 
  gPop();
  
  gPop();
}
function openclosemout(timestamp){
  if(timestamp> 23520){
    piclose = Math.abs(Math.sin(timestamp / 1000)); 
  }
  else{
    piclose+=0;
  }
}
function renderFlower(xposition,zposition) {

  toggleTint(0);//turn off tint on the flowers
  //gTranslate(0,-5,0);
gPush();
gTranslate(xposition,-4.9,zposition);

  gPush();
  {
    // Draw stem
    setColor(vec4(0.0, 0.5, 0.0, 1.0)); 
    gPush();
    {
      gTranslate(0, 0.5, -0.1);
      gScale(0.07, 0.9, 0.07);
      drawCube();
    }
    gPop();


    setColor(vec4(1.0, 0.0, 0.0, 1.0)); 
    for (let i = 0; i < 5; i++) {
      gPush();
      {
        //petals
        let angle = (i * 72) * (Math.PI / 180); 
        let x = Math.cos(angle) * 0.5;
        let y = Math.sin(angle) * 0.5;
        gTranslate(x, y + 1.5, 0);
        gScale(0.3, 0.3, 0.1);
        drawSphere();
      }
      gPop();
    }


    setColor(vec4(1.0, 1.0, 0.0, 1.0)); 
    gPush();
    {
      gTranslate(0, 1.5, 0);
      gScale(0.3, 0.3, 0.3);
      drawSphere();
    }
    gPop();
  }
  gPop();
  gPop();
  //gPop();
}

function updatePig(timestamp) {
  if (timestamp >  23520 & timestamp<25000) {
      PIGY += direction2*0.5; 
      shrinkpig-=updateskrink*1.5;

  }
  if (timestamp > 25000 & timestamp<29000) {
    PIGY += direction2*0.9; 
    //shrinkpig=updateskrink;
}
  if (timestamp > 29000 ) {
    shrinkpig=0;
  }
}

  let ufoX = 8;
  let direction = -0.02;
  let ufoRotation = 0;
  let time = 0;
  
  function renderUFO() {
      let ufoY = Math.sin(time) * 0.5; // sinewave for move up dow
      
      gPush();
      gTranslate(ufoX, 3+ufoY, 0); 
      gRotate(ufoRotation, 0, 1, 0);
      gScale(1.3, 1.3, 1.3);
      
      // The like body
      setColor(vec4(0.6, 0.6, 0.6, 1));
      gPush();
          gScale(1.2, 0.3, 1.2);
          drawSphere();
      gPop();
      
 
      setColor(vec4(0.2, 0.8, 1, 1));
      gPush();
          gTranslate(0, 0.3, 0);
          gScale(0.5, 0.3, 0.5);
          drawSphere();
      gPop();
      
      setColor(vec4(0.3, 0.3, 0.3, 1));
      for (let i = 0; i < 3; i++) {
          gPush();
              let angle = (i * 120) * (Math.PI / 180);
              let x = Math.cos(angle) * 0.8;
              let z = Math.sin(angle) * 0.8;
              gTranslate(x, -0.29, z);
              gRotate(90, 1, 0, 0);
              gScale(0.2, 0.5, 0.2);
              drawCylinder();
          gPop();
      }
      
      gPop();
  }
  
  function updateUFO(timestamp) {
    if (timestamp>8500 && timestamp<20000) {
      ufoX += direction;
      ufoRotation += 2; 
      time += 0.1;
  }

}

let ufoX3 = 7;
let direction3 = -0.02;
let ufoRotation3 = 0;
let time3 = 0;

function renderUFO2() {
    let ufoY = Math.sin(time3) * 0.5; // sinewave for move up down
    gScale(1.3,1.3,1.3);
    gPush();
    gTranslate(ufoX3, 2+ufoY, 0); 
    gRotate(ufoRotation3, 0, 1, 0);
    gScale(1.5, 1.5, 1.5);
    
    // The like body
    setColor(vec4(0.6, 0.6, 0.6, 1));
    gPush();
        gScale(1.2, 0.3, 1.2);
        drawSphere();
    gPop();
    

    setColor(vec4(0.2, 0.8, 1, 1));
    gPush();
        gTranslate(0, 0.3, 0);
        gScale(0.5, 0.3, 0.5);
        drawSphere();
    gPop();
    
    setColor(vec4(0.3, 0.3, 0.3, 1));
    for (let i = 0; i < 3; i++) {
        gPush();
            let angle = (i * 120) * (Math.PI / 180);
            let x = Math.cos(angle) * 0.8;
            let z = Math.sin(angle) * 0.8;
            gTranslate(x, -0.29, z);
            gRotate(90, 1, 0, 0);
            gScale(0.2, 0.5, 0.2);
            drawCylinder();
        gPop();
    }
    
    gPop();
}

function updateUFO2(timestamp) {
  if (timestamp > 20000 && timestamp<23500) {
    ufoX3 += direction3;
    ufoRotation3 += 2; 
    time3 += 0.1;
}
if (timestamp > 23500 && timestamp<29550){
  gPush();
  toggleTint(1);
}

if (timestamp > 29550 ) {
  toggleTint(0);
  ufoX3 += direction3;
  ufoRotation3 += 2; 
  time3 += 0.1;
}

}

function renderbackground() {
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture3"), 3);

  gPush();
  {
    
    putmytexture();
    setColor(vec4(1.0, 1.0, 1.0, 1)); 

    gPush();
    {
      gTranslate(0, 0, -40); 
      gScale(90.0, 10.0, 1.0); 
      drawCube(); 
    }
    gPop();
    gPush();
    {
      gTranslate(0, 0, 40); 
      gScale(90.0, 10.0, 1.0);
      drawCube(); 
    }
    gPop();
    gPush();
    {
      gTranslate(-20, 0, 0); 
      gRotate(90, 0, 1, 0); 
      gScale(90.0, 90.0, 1.0);
      drawCube();
    }
    gPop();

    gPush();
    {
      gTranslate(20, 0, 0); 
      gRotate(-90, 0, 1, 0); 
      gScale(90.0, 10.0, 1.0);
      drawCube();
    }
    gPop();
    putmytexture();
  }
  gPop();
}

/*
function rendertree() {
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture3"), 2);

  gPush();
  {
    toggleTextureBlending();
    setColor(vec4(0.5, 0, 0.6, 1));
    //ading the bottom
    gPush();
    {
      gTranslate(-1,-2,0);
      gRotate(90, 1, 0, 0);
      gScale(1.0, 1.0, 6.0);
      drawCylinder();
    }
    gPop();
    toggleTextureBlending();
  }
  gPop();
}

function rendertreetop() {
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureArray[3].textureWebGL);
  gl.uniform1i(gl.getUniformLocation(program, "texture3"), 2);

  gPush();
  {
    toggleTextureBlending();
    setColor(vec4(0.5, 0, 0.6, 1));
    //ading the top
    gPush();
    {
      gTranslate(-1,2,0);
      //gRotate(90, 1, 0, 0);
      gScale(2.0, 2.0, 2.0);
      drawSphere();
    }
    gPop();
    toggleTextureBlending();
  }
  gPop();
}
  */