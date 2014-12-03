/* jshint node:false, browser:true, undef:true, esnext: true */
/* global jQuery, io, PIXI, Vector, console, Shape  */

"use strict";

var size = 5;

var width = Math.floor(window.innerWidth / size);
var height = Math.floor(window.innerHeight / size);


var grid = [],
	squares = [];

var stage, renderer, bitmapSquare;

var vectors = [];
var addedVec = new Vector(0, 0);

var steeringForce = 0.1;


var borderPoint = {
	isWall: true
};

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
	if (x < 0 || x >= width || y < 0 || y >= height) {
		return borderPoint;
	}
	var index = y * width + x;
	var ret = grid[index];

	if (!ret) {
		//console.log(ret, index, x, y, grid.length);
	}
	return grid[index];

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

function applyForceToSquare(square, force) {
	// Slow down
	square.velocity = square.velocity.multiply(0.3);

	// Add new acceleration
	square.velocity = square.velocity.add(force);

	var length = square.velocity.length();

	if (length < 0.05) {
		return square.velocity.multiply(0);
	}

	if (length > 5) {
		log(square.velocity, square.velocity.length);
	}
	// Max speed
	if (length > maxSpeed) square.velocity.multiply(maxSpeed / length);

	// Internal floating location
	square.pos = square.pos.add(square.velocity);
}

function applyMove(oldLoc, newLoc, square) {
	newLoc.square = oldLoc.square;
	oldLoc.square = false;
	square.curGrid = newLoc.index;

	updateGridElement(newLoc);
	updateGridElement(oldLoc);
}

function moveSquare(square) {
	let oldLoc = grid[square.curGrid];
	let x = oldLoc.x;
	let y = oldLoc.y;
	let force = getForceOfSurrounding(x, y);

	if (!force.x && !force.y) return;

	applyForceToSquare(square, force);


	let newLoc = getAffectedGridElement(x, y, square.velocity);


	if (!newLoc.square && !newLoc.isWall) {
		applyMove(oldLoc, newLoc, square);
	}
}




function getAffectedGridElement(x, y, f) {
	var p = new Vector(x, y);

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
	//log(centerPoint);
}



function setupPixi() {
	// Setup Pixi
	stage = new PIXI.Stage(0xFFFFFF, false);
	//stage.interactive = true;

	renderer = PIXI.autoDetectRenderer(width * size, height * size);

	document.body.appendChild(renderer.view);

	stage.mousemove = stage.touchmove = mouseMove;

	renderer.render(stage);
	requestAnimationFrame(draw);


	// First we fill the grid
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			let index = j * width + i;
			var point = new Vector(i * size, j * size);
			//var shape = createActor(point, 0xffffff, 0xcccccc);
		}
	}

	// First we fill the grid
	for (let i = 0; i < width; i++) {
		for (let j = 0; j < height; j++) {
			let index = j * width + i;
			grid[index] = {
				x: i,
				y: j,
				index: index
			};

			if (Math.random() < 0.064) {
				grid[index].square = new Square(i, j);
				grid[index].square.curGrid = index;
			}

			updateGridElement(grid[index]);
		}
	}

}

// Standard draw loop
function draw() {
	requestAnimationFrame(draw);
	squares.forEach(moveSquare);
	renderer.render(stage);
}




function createActor(point, fill, line) {
	var graphics = new PIXI.Graphics();
	graphics.beginFill(fill || Math.random() * 16777215, 1);
	graphics.lineStyle(2, line || 0x0000FF, 1);
	graphics.drawRect(0, 0, size, size);

	var actor = new PIXI.Sprite(graphics.generateTexture());
	actor.interactive = true;
	actor.x = point.x;
	actor.y = point.y;
	return stage.addChild(actor);
}


setupPixi();
