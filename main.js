/* jshint node:false, browser:true, undef:true, esnext: true */
/* global jQuery, io, PIXI, Vector, console, Shape  */

"use strict";

var size = 5;

var width = Math.floor(window.innerWidth / size);
var height = Math.floor(window.innerHeight / size);

var mousePointer = {};

var grid = [],
	squares = [];

var stage, renderer, bitmapSquare;

var vectors = [];
var addedVec = new Vector(0, 0);

var steeringForce = 0.1;


var borderPoint = {
	isWall: true,
	outside: true
};

var outsidePoint = {
	outside: true
};

var amountOfSquares = 0;

var maxSpeed = 5;

var log = console.log.bind(console);
    log = function () {};

var centerPoint = new Vector(width * size / 2, height * size / 2);



function Square(x, y) {
	this.pos = new Vector(x, y);
	this.bigPos = this.pos * size;
	this.velocity = new Vector(0, 0);

	var shape = createActor(this.bigPos);
	// shape.fillColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
	// shape.strokeColor = 'red';

	// var debug = new Shape.Rectangle(this.bigPos, size);
	// debug.fillColor = 'blue';
	// debug.strokeColor = 'red';
	// debug.opacity = 0;


	this.screenElement = shape;
	this.debugElement = {};

	squares.push(this);
}


function getGridSection(x, y) {
	//
	if (x > (centerPoint.x - 2) && x < (centerPoint.x + 2) && y > (centerPoint.y - 2) && y < (centerPoint.y + 2)) {
		return borderPoint;
	}

	// There an invisible border around the canvas
	if (x < -1 || x > width + 1 || y < -1 || y > height + 1) {
		return borderPoint;
	}
	// There an invisible border around the canvas
	if (x < 0 || x >= width || y < 0 || y >= height) {
		return outsidePoint;
	}
	var index = y * width + x;
	return grid[index] || {};
}


function getForceOfSurrounding(x, y) {
	var a = 2;
	var count = 0;
	var force = new Vector(0, 0);
	var centerPoint = new Vector(x, y);

	// Loop through a 5x5 grid around the selected point
	for (var i = (x - a); i < (x + a + 1); i++) {
		for (var j = (y - a); j < (y + a + 1); j++) {

			var grid = getGridSection(i, j);


			// Add to force if occupied:
			if (grid.square || grid.isWall) {
				var point = new Vector(i, j);
				var vectorFromCenter = centerPoint.subtract(point);
				count++;
				force = force.add(vectorFromCenter);
			}
		}
	}
	// Scale it a bit
	return force.divide(Math.pow(count, 1 / 2.4));
}

function calculateVelocity(square, force) {
	// Slow down
	square.velocity = square.velocity.multiply(0.3);

	// Add new acceleration
	square.velocity = square.velocity.add(force);

	var length = square.velocity.length();

	if (length < 0.05) {
		return square.velocity.multiply(0);
	}

	// Max speed
	if (length > maxSpeed) square.velocity.multiply(maxSpeed / length);

}

function applyMove(oldLoc, newLoc, square) {
	newLoc.square = oldLoc.square;
	oldLoc.square = false;
	square.curIndex = newLoc.index;
	square.curGrid = newLoc;

	updateGridElement(newLoc);
	updateGridElement(oldLoc);
}

var test_x, test_y, oldLoc;

function moveSquare(square) {
	var oldLoc = square.curGrid;
	var x = oldLoc.x;
	var y = oldLoc.y;
	var force = getForceOfSurrounding(x, y);

	if (!force.x && !force.y) return;

	calculateVelocity(square, force);

	// Internal floating location
	var newLoc = getAffectedGridElement(square.pos, square.velocity);
	square.pos = square.pos.add(square.velocity);

	if (!newLoc.square && !newLoc.isWall) {
		applyMove(oldLoc, newLoc, square);
	}
}



function getAffectedGridElement(p, f) {
	var dest = p.add(f);
	dest = dest.round();

	var gridElement = getGridSection(dest.x, dest.y);
	if (gridElement.isWall || gridElement.square) {
		// Try to half the force
		f = f.divide(2);
		dest = p.add(f);
		dest = dest.round();
		gridElement = getGridSection(dest.x, dest.y);
	}
	return gridElement;
}

function updateGridElement(gridElement) {
	var square = gridElement.square;
	if (square) {
		square.screenElement.x = gridElement.x * size;
		square.screenElement.y = gridElement.y * size;
		square.debugElement.x = square.pos.x * size;
		square.debugElement.y = square.pos.y * size;
	}
}


function mouseMove(e) {
	centerPoint = new Vector(e.global.x / size, e.global.y / size).round();
	mousePointer.x = e.global.x - 5;
	mousePointer.y = e.global.y - 5;
}



function setupPixi() {
	// Setup Pixi
	stage = new PIXI.Stage(0x000, false);
	//stage.interactive = true;

	renderer = PIXI.autoDetectRenderer(width * size, height * size);

	document.body.appendChild(renderer.view);

	stage.mousemove = stage.touchmove = mouseMove;

	renderer.render(stage);
	requestAnimationFrame(draw);


	// First we fill the grid
	for (var i = 0; i < width; i++) {
		for (var j = 0; j < height; j++) {
			var index = j * width + i;
			grid[index] = {
				x: i,
				y: j,
				index: index
			};

			if (Math.random() < 0.064) {
				grid[index].square = new Square(i, j);
				grid[index].square.curIndex = index;
				grid[index].square.curGrid = grid[index];
			}

			updateGridElement(grid[index]);
		}
	}

	amountOfSquares = squares.length;
	var text = new PIXI.Text('the thing – it’s name', {
		font:"50px Georgia",
		fill: 'white',
		align: 'center',
		stroke: 'red',
		strokeThickness: 2
	});
	// text.position.x = width;
	// text.position.y = height*2;
	// stage.addChild(text);
	//mouse();

}


// Standard draw loop
function draw() {
	requestAnimationFrame(draw);

	var l = amountOfSquares;
	while(l--) {
		moveSquare(squares[l]);
	}
	renderer.render(stage);
}


function createActor(point, fill, line) {
	var graphics = new PIXI.Graphics();
	graphics.beginFill(fill || 0xFFFFFF || Math.random() * 16777215, 1);
	//graphics.lineStyle(0, line || 0x0000FF, 1);
	graphics.drawRect(0, 0, 2, 2);

	var actor = new PIXI.Sprite(graphics.generateTexture());
	actor.interactive = true;
	actor.x = point.x;
	actor.y = point.y;
	return stage.addChild(actor);
}

var texture;

function generateTexture() {
	var graphics = new PIXI.Graphics();
	//graphics.beginFill(0xFF0000 || Math.random() * 16777215, 1);
	graphics.lineStyle(2, 0xFF0000, 2);
	graphics.drawCircle(0, 0, 10);
	texture = graphics.generateTexture();
}

function mouse() {
	mousePointer = new PIXI.Sprite(texture);
	return stage.addChild(mousePointer);
}

generateTexture();
setupPixi();
