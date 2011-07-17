/**
 * Kinetic JS JavaScript Library v1.2.0
 * http://www.kineticjs.com/
 * Copyright 2011, Eric Rowell
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: July 02 2011
 *
 * Copyright (C) 2011 by Eric Rowell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * Kudos to Brandon Jones' sick glMatrix library, which makes vector operations
 * stupid fast.  If you're using the WebGL wrapper, make sure you include Brandon's library
 * because the WebGL methods depend on it.
 * 
 * http://code.google.com/p/glmatrix/
 */
var Kinetic = function(canvasId, contextType){
    this.canvas = document.getElementById(canvasId);
    
    // General
    this.context = this.canvas.getContext(contextType);
    this.is2dContext = contextType.indexOf("2d") != -1;
    this.drawStage = undefined;
    this.listening = false;
    
    // Canvas Events 
    this.mousePos = null;
    this.mouseDown = false;
    this.mouseUp = false;
    
    // Region Events
    this.currentRegion = null;
    this.regionCounter = 0;
    this.lastRegionIndex = null;
    
    // Animation 
    this.t = 0;
    this.timeInterval = 0;
    this.startTime = 0;
    this.lastTime = 0;
    this.frame = 0;
    this.animating = false;
    
    // WebGL
    if (!this.is2dContext) {
        // shader type constants
        this.BLUE_COLOR = "BLUE_COLOR";
        this.VARYING_COLOR = "VARYING_COLOR";
        this.TEXTURE = "TEXTURE";
        this.TEXTURE_DIRECTIONAL_LIGHTING = "TEXTURE_DIRECTIONAL_LIGHTING";
        
        this.shaderProgram = null;
        this.mvMatrix = mat4.create();
        this.pMatrix = mat4.create();
        this.mvMatrixStack = [];
        this.context.viewportWidth = this.canvas.width;
        this.context.viewportHeight = this.canvas.height;
        
        // init depth test
        this.context.enable(this.context.DEPTH_TEST);
    }
};

// ======================================= GENERAL =======================================

Kinetic.prototype.getContext = function(){
    return this.context;
};

Kinetic.prototype.getCanvas = function(){
    return this.canvas;
};

Kinetic.prototype.clear = function(){
    if (this.is2dContext) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    else { // webgl clear
        this.context.viewport(0, 0, this.context.viewportWidth, this.context.viewportHeight);
        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
    }
};

Kinetic.prototype.getPos = function(obj){
    var top = 0;
    var left = 0;
    while (obj.tagName != "BODY") {
        top += obj.offsetTop;
        left += obj.offsetLeft;
        obj = obj.offsetParent;
    }
    return {
        top: top,
        left: left
    };
};

Kinetic.prototype.reset = function(evt){
    this.setMousePosition(evt);
    this.regionCounter = 0;
    
    if (!this.animating && this.drawStage !== undefined) {
        this.drawStage();
    }
    
    this.mouseDown = false;
    this.mouseUp = false;
};

// ======================================= STAGE =======================================

Kinetic.prototype.setDrawStage = function(func){
    this.drawStage = func;
    this.listen();
};
Kinetic.prototype.drawStage = function(){
    if (this.drawStage !== undefined) {
        this.drawStage();
    }
};

// ======================================= CANVAS EVENTS =======================================

Kinetic.prototype.isMousedown = function(){
    return this.mouseDown;
};
Kinetic.prototype.isMouseup = function(){
    return this.mouseUp;
};

Kinetic.prototype.listen = function(){
    // store current listeners
    var that = this;
    var canvasOnmouseover = this.canvas.onmouseover;
    var canvasOnmouseout = this.canvas.onmouseout;
    var canvasOnmousemove = this.canvas.onmousemove;
    var canvasOnmousedown = this.canvas.onmousedown;
    var canvasOnmouseup = this.canvas.onmouseup;
    
    if (this.drawStage !== undefined) {
        this.drawStage();
    }
    
    this.canvas.onmouseover = function(e){
        if (!e) {
            e = window.event;
        }
        
        that.setMousePosition(e);
        if (typeof(canvasOnmouseover) == typeof(Function)) {
            canvasOnmouseover();
        }
    };
    this.canvas.onmouseout = function(){
        that.mousePos = null;
        if (typeof(canvasOnmouseout) == typeof(Function)) {
            canvasOnmouseout();
        }
    };
    this.canvas.onmousemove = function(e){
        if (!e) {
            e = window.event;
        }
        that.reset(e);
        
        if (typeof(canvasOnmousemove) == typeof(Function)) {
            canvasOnmousemove();
        }
    };
    this.canvas.onmousedown = function(e){
        if (!e) {
            e = window.event;
        }
        that.mouseDown = true;
        that.reset(e);
        
        if (typeof(canvasOnmousedown) == typeof(Function)) {
            canvasOnmousedown();
        }
    };
    this.canvas.onmouseup = function(e){
        if (!e) {
            e = window.event;
        }
        that.mouseUp = true;
        that.reset(e);
        
        if (typeof(canvasOnmouseup) == typeof(Function)) {
            canvasOnmouseup();
        }
    };
};

Kinetic.prototype.getMousePos = function(evt){
    return this.mousePos;
};
Kinetic.prototype.setMousePosition = function(evt){
    var mouseX = evt.clientX - this.getPos(this.canvas).left + window.pageXOffset;
    var mouseY = evt.clientY - this.getPos(this.canvas).top + window.pageYOffset;
    this.mousePos = {
        x: mouseX,
        y: mouseY
    };
};

// ======================================= REGION EVENTS =======================================

Kinetic.prototype.beginRegion = function(){
    this.currentRegion = {};
    this.regionCounter++;
};
Kinetic.prototype.addRegionEventListener = function(type, func){
    if (type == "onmouseover") {
        this.currentRegion.onmouseover = func;
    }
    else if (type == "onmouseout") {
        this.currentRegion.onmouseout = func;
    }
    else if (type == "onmousemove") {
        this.currentRegion.onmousemove = func;
    }
    else if (type == "onmousedown") {
        this.currentRegion.onmousedown = func;
    }
    else if (type == "onmouseup") {
        this.currentRegion.onmouseup = func;
    }
};
Kinetic.prototype.closeRegion = function(){
    if (this.mousePos !== null && this.context.isPointInPath(this.mousePos.x, this.mousePos.y)) {
    
        // handle onmousemove
        // do this everytime
        if (this.currentRegion.onmousemove !== undefined) {
            this.currentRegion.onmousemove();
        }
        
        // handle onmouseover
        if (this.lastRegionIndex != this.regionCounter) {
            this.lastRegionIndex = this.regionCounter;
            
            if (this.currentRegion.onmouseover !== undefined) {
                this.currentRegion.onmouseover();
            }
        }
        
        // handle onmousedown
        if (this.mouseDown && this.currentRegion.onmousedown !== undefined) {
            this.currentRegion.onmousedown();
            this.mouseDown = false;
        }
        
        // handle onmouseup
        if (this.mouseUp && this.currentRegion.onmouseup !== undefined) {
            this.currentRegion.onmouseup();
            this.mouseUp = false;
        }
        
    }
    else if (this.regionCounter == this.lastRegionIndex) {
        // handle mouseout condition
        this.lastRegionIndex = null;
        
        if (this.currentRegion.onmouseout !== undefined) {
            this.currentRegion.onmouseout();
        }
    }
    
    this.regionCounter++;
};

// ======================================= ANIMATION =======================================

Kinetic.prototype.getFrame = function(){
    return this.frame;
};
Kinetic.prototype.startAnimation = function(){
    this.animating = true;
    var date = new Date();
    this.startTime = date.getTime();
    this.lastTime = this.startTime;
    
    if (this.drawStage !== undefined) {
        this.drawStage();
    }
    
    this.animationLoop();
};
Kinetic.prototype.stopAnimation = function(){
    this.animating = false;
};
Kinetic.prototype.getTimeInterval = function(){
    return this.timeInterval;
};
Kinetic.prototype.getTime = function(){
    return this.t;
};
Kinetic.prototype.getFps = function(){
    return 1000 / this.timeInterval;
};
Kinetic.prototype.animationLoop = function(){
    var that = this;
    
    this.frame++;
    var date = new Date();
    var thisTime = date.getTime();
    this.timeInterval = thisTime - this.lastTime;
    this.t += this.timeInterval;
    this.lastTime = thisTime;
    
    if (this.drawStage !== undefined) {
        this.drawStage();
    }
    
    if (this.animating) {
        requestAnimFrame(function(){
            that.animationLoop();
        });
    }
};

// ======================================= WEBGL WRAPPER =======================================

Kinetic.prototype.save = function(){
    var copy = mat4.create();
    mat4.set(this.mvMatrix, copy);
    this.mvMatrixStack.push(copy);
};

Kinetic.prototype.restore = function(){
    if (this.mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    this.mvMatrix = this.mvMatrixStack.pop();
};

Kinetic.prototype.getFragmentShaderGLSL = function(shaderType){
    switch (shaderType) {
        case this.BLUE_COLOR:
            return "#ifdef GL_ES\n" +
            "precision highp float;\n" +
            "#endif\n" +
            "void main(void) {\n" +
            "gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);\n" +
            "}";
        case this.VARYING_COLOR:
            return "#ifdef GL_ES\n" +
            "precision highp float;\n" +
            "#endif\n" +
            "varying vec4 vColor;\n" +
            "void main(void) {\n" +
            "gl_FragColor = vColor;\n" +
            "}";
        case this.TEXTURE:
            return "#ifdef GL_ES\n" +
            "precision highp float;\n" +
            "#endif\n" +
            "varying vec2 vTextureCoord;\n" +
            "uniform sampler2D uSampler;\n" +
            "void main(void) {\n" +
            "gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n" +
            "}";
        case this.TEXTURE_DIRECTIONAL_LIGHTING:
            return "#ifdef GL_ES\n" +
            "precision highp float;\n" +
            "#endif\n" +
            "varying vec2 vTextureCoord;\n" +
            "varying vec3 vLightWeighting;\n" +
            "uniform sampler2D uSampler;\n" +
            "void main(void) {\n" +
            "vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n" +
            "gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n" +
            "}";
    }
};

Kinetic.prototype.getVertexShaderGLSL = function(shaderType){
    switch (shaderType) {
        case this.BLUE_COLOR:
            return "attribute vec3 aVertexPosition;\n" +
            "uniform mat4 uMVMatrix;\n" +
            "uniform mat4 uPMatrix;\n" +
            "void main(void) {\n" +
            "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
            "}";
        case this.VARYING_COLOR:
            return "attribute vec3 aVertexPosition;\n" +
            "attribute vec4 aVertexColor;\n" +
            "uniform mat4 uMVMatrix;\n" +
            "uniform mat4 uPMatrix;\n" +
            "varying vec4 vColor;\n" +
            "void main(void) {\n" +
            "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
            "vColor = aVertexColor;\n" +
            "}";
        case this.TEXTURE:
            return "attribute vec3 aVertexPosition;\n" +
            "attribute vec2 aTextureCoord;\n" +
            "uniform mat4 uMVMatrix;\n" +
            "uniform mat4 uPMatrix;\n" +
            "varying vec2 vTextureCoord;\n" +
            "void main(void) {\n" +
            "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
            "vTextureCoord = aTextureCoord;\n" +
            "}";
        case this.TEXTURE_DIRECTIONAL_LIGHTING:
            return "attribute vec3 aVertexPosition;\n" +
            "attribute vec3 aVertexNormal;\n" +
            "attribute vec2 aTextureCoord;\n" +
            "uniform mat4 uMVMatrix;\n" +
            "uniform mat4 uPMatrix;\n" +
            "uniform mat3 uNMatrix;\n" +
            "uniform vec3 uAmbientColor;\n" +
            "uniform vec3 uLightingDirection;\n" +
            "uniform vec3 uDirectionalColor;\n" +
            "uniform bool uUseLighting;\n" +
            "varying vec2 vTextureCoord;\n" +
            "varying vec3 vLightWeighting;\n" +
            "void main(void) {\n" +
            "gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
            "vTextureCoord = aTextureCoord;\n" +
            "if (!uUseLighting) {\n" +
            "vLightWeighting = vec3(1.0, 1.0, 1.0);\n" +
            "} else {\n" +
            "vec3 transformedNormal = uNMatrix * aVertexNormal;\n" +
            "float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);\n" +
            "vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;\n" +
            "}\n" +
            "}";
    }
};

Kinetic.prototype.initShaders = function(shaderType){
    this.initPositionShader();
    
    switch (shaderType) {
        case this.VARYING_COLOR:
            this.initColorShader();
            break;
        case this.TEXTURE:
            this.initTextureShader();
            break;
        case this.TEXTURE_DIRECTIONAL_LIGHTING:
            this.initTextureShader();
            this.initNormalShader();
            this.initLightingShader();
            break;
    }
};

Kinetic.prototype.setShaderProgram = function(shaderType){
    var fragmentGLSL = this.getFragmentShaderGLSL(shaderType);
    var vertexGLSL = this.getVertexShaderGLSL(shaderType);
    
    var fragmentShader = this.context.createShader(this.context.FRAGMENT_SHADER);
    this.context.shaderSource(fragmentShader, fragmentGLSL);
    this.context.compileShader(fragmentShader);
    
    var vertexShader = this.context.createShader(this.context.VERTEX_SHADER);
    this.context.shaderSource(vertexShader, vertexGLSL);
    this.context.compileShader(vertexShader);
    
    this.shaderProgram = this.context.createProgram();
    this.context.attachShader(this.shaderProgram, vertexShader);
    this.context.attachShader(this.shaderProgram, fragmentShader);
    this.context.linkProgram(this.shaderProgram);
    
    if (!this.context.getProgramParameter(this.shaderProgram, this.context.LINK_STATUS)) {
        alert("Could not initialize shaders");
    }
    
    this.context.useProgram(this.shaderProgram);
    
    // once shader program is loaded, it's time to init the shaders
    this.initShaders(shaderType);
};

Kinetic.prototype.perspective = function(viewAngle, minDist, maxDist){
    mat4.perspective(viewAngle, this.context.viewportWidth / this.context.viewportHeight, minDist, maxDist, this.pMatrix);
};

Kinetic.prototype.identity = function(){
    mat4.identity(this.mvMatrix);
};

Kinetic.prototype.translate = function(x, y, z){
    mat4.translate(this.mvMatrix, [x, y, z]);
};

Kinetic.prototype.rotate = function(angle, x, y, z){
    mat4.rotate(this.mvMatrix, angle, [x, y, z]);
};

Kinetic.prototype.initPositionShader = function(){
    this.shaderProgram.vertexPositionAttribute = this.context.getAttribLocation(this.shaderProgram, "aVertexPosition");
    this.context.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    this.shaderProgram.pMatrixUniform = this.context.getUniformLocation(this.shaderProgram, "uPMatrix");
    this.shaderProgram.mvMatrixUniform = this.context.getUniformLocation(this.shaderProgram, "uMVMatrix");
};

Kinetic.prototype.initColorShader = function(){
    this.shaderProgram.vertexColorAttribute = this.context.getAttribLocation(this.shaderProgram, "aVertexColor");
    this.context.enableVertexAttribArray(this.shaderProgram.vertexColorAttribute);
};

Kinetic.prototype.initTextureShader = function(){
    this.shaderProgram.textureCoordAttribute = this.context.getAttribLocation(this.shaderProgram, "aTextureCoord");
    this.context.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);
    this.shaderProgram.samplerUniform = this.context.getUniformLocation(this.shaderProgram, "uSampler");
};

Kinetic.prototype.initNormalShader = function(){
    this.shaderProgram.vertexNormalAttribute = this.context.getAttribLocation(this.shaderProgram, "aVertexNormal");
    this.context.enableVertexAttribArray(this.shaderProgram.vertexNormalAttribute);
    this.shaderProgram.nMatrixUniform = this.context.getUniformLocation(this.shaderProgram, "uNMatrix");
};

Kinetic.prototype.initLightingShader = function(){
    this.shaderProgram.useLightingUniform = this.context.getUniformLocation(this.shaderProgram, "uUseLighting");
    this.shaderProgram.ambientColorUniform = this.context.getUniformLocation(this.shaderProgram, "uAmbientColor");
    this.shaderProgram.lightingDirectionUniform = this.context.getUniformLocation(this.shaderProgram, "uLightingDirection");
    this.shaderProgram.directionalColorUniform = this.context.getUniformLocation(this.shaderProgram, "uDirectionalColor");
};

Kinetic.prototype.initTexture = function(texture){
    this.context.pixelStorei(this.context.UNPACK_FLIP_Y_WEBGL, true);
    this.context.bindTexture(this.context.TEXTURE_2D, texture);
    this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, texture.image);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.NEAREST);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.LINEAR_MIPMAP_NEAREST);
    this.context.generateMipmap(this.context.TEXTURE_2D);
    this.context.bindTexture(this.context.TEXTURE_2D, null);
};

Kinetic.prototype.createArrayBuffer = function(vertices){
    var buffer = this.context.createBuffer();
    buffer.numElements = vertices.length;
    this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
    this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array(vertices), this.context.STATIC_DRAW);
    return buffer;
};

Kinetic.prototype.createElementArrayBuffer = function(vertices){
    var buffer = this.context.createBuffer();
    buffer.numElements = vertices.length;
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, buffer);
    this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertices), this.context.STATIC_DRAW);
    return buffer;
};

Kinetic.prototype.pushPositionBuffer = function(buffers){
    this.context.bindBuffer(this.context.ARRAY_BUFFER, buffers.positionBuffer);
    this.context.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, 3, this.context.FLOAT, false, 0, 0);
};


Kinetic.prototype.pushColorBuffer = function(buffers){
    this.context.bindBuffer(this.context.ARRAY_BUFFER, buffers.colorBuffer);
    this.context.vertexAttribPointer(this.shaderProgram.vertexColorAttribute, 4, this.context.FLOAT, false, 0, 0);
};

Kinetic.prototype.pushTextureBuffer = function(buffers, texture){
    this.context.bindBuffer(this.context.ARRAY_BUFFER, buffers.textureBuffer);
    this.context.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, 2, this.context.FLOAT, false, 0, 0);
    this.context.activeTexture(this.context.TEXTURE0);
    this.context.bindTexture(this.context.TEXTURE_2D, texture);
    this.context.uniform1i(this.shaderProgram.samplerUniform, 0);
};

Kinetic.prototype.pushIndexBuffer = function(buffers){
    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
};

Kinetic.prototype.pushNormalBuffer = function(buffers){
    this.context.bindBuffer(this.context.ARRAY_BUFFER, buffers.normalBuffer);
    this.context.vertexAttribPointer(this.shaderProgram.vertexNormalAttribute, 3, this.context.FLOAT, false, 0, 0);
};

Kinetic.prototype.setMatrixUniforms = function(){
    this.context.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
    this.context.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
    
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(this.mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    this.context.uniformMatrix3fv(this.shaderProgram.nMatrixUniform, false, normalMatrix);
};

Kinetic.prototype.drawElements = function(buffers){
    this.setMatrixUniforms();
    
    // draw elements
    this.context.drawElements(this.context.TRIANGLES, buffers.indexBuffer.numElements, this.context.UNSIGNED_SHORT, 0);
};

Kinetic.prototype.drawArrays = function(buffers){
    this.setMatrixUniforms();
    
    // draw arrays
    this.context.drawArrays(this.context.TRIANGLES, 0, buffers.positionBuffer.numElements / 3);
};

Kinetic.prototype.enableLighting = function(){
    this.context.uniform1i(this.shaderProgram.useLightingUniform, true);
};

Kinetic.prototype.setAmbientLighting = function(red, green, blue){
    this.context.uniform3f(this.shaderProgram.ambientColorUniform, parseFloat(red), parseFloat(green), parseFloat(blue));
};

Kinetic.prototype.setDirectionalLighting = function(x, y, z, red, green, blue){
    // directional lighting
    var lightingDirection = [x, y, z];
    var adjustedLD = vec3.create();
    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, -1);
    this.context.uniform3fv(this.shaderProgram.lightingDirectionUniform, adjustedLD);
    
    // directional color
    this.context.uniform3f(this.shaderProgram.directionalColorUniform, parseFloat(red), parseFloat(green), parseFloat(blue));
};

// ======================================= UTILITIES =======================================

// Sweet shim provided by Paul Irish
window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    };
})();
