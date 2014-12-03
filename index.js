/* jshint node:false, browser:true, undef:true */
/* global jQuery, io, PIXI, Point, console, Shape  */
// 5x5 grid
var width = 40;
var height = 40;
var size = 15;

var grid = [];

var vectors = [];
var addedVec = new Point(0, 0);

var steeringForce = 0.1;


var borderPoint = {
	isWall: true
};

var maxSpeed = 8;

var log = console.log;
//log = function () {};

var centerPoint = new Point(width * size / 2, height * size / 2);



function Square(x, y) {
	this.pos = new Point(x, y);
	this.bigPos = this.pos * size;
	this.velocity = new Point(0, 0);
	this.acceleration = new Point(0, 0);

	var shape = new Shape.Rectangle(this.bigPos, size);
	shape.fillColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
	shape.strokeColor = 'red';

	var debug = new Shape.Rectangle(this.bigPos, size);
	debug.fillColor = 'blue';
	debug.strokeColor = 'red';
	debug.opacity = 0;


	this.screenElement = shape;
	this.debugElement = debug;
}

// First we fill the grid
for (var i = 0; i < width; i++) {
	for (var j = 0; j < height; j++) {
		var index = j * width + i;
		var point = new Point(i * size, j * size);
		var shape = new Shape.Rectangle(point, size);
		//var shape = new Shape.Rectangle(new Point(j, i), size);
		shape.fillColor = 'white';
		shape.strokeColor = 'grey';
	}
}

// First we fill the grid
for (var i = 0; i < width; i++) {
	for (var j = 0; j < height; j++) {
		var index = j * width + i;
		grid[index] = {
			x: i,
			y: j
		};

		if (Math.random() < 0.01) {
			grid[index].square = new Square(i, j);
		}

		updateGridElement(grid[index]);
	}
}

function getGridSection(x, y) {
	// There an invisible border two squares wide/high
	if (x < 0 || x >= width || y < 0 || y >= height) {
		return borderPoint;
	} else {
		var index = y * width + x;
		var ret = grid[index];

		if (!ret) {
			//console.log(ret, index, x, y, grid.length);
		}
		return grid[index];
	}
}


function getForceOfSurrounding(x, y) {
	var a = 2;
	var count = 0;
	var force = new Point(0, 0);
	var centerPoint = new Point(x, y);

	// Loop through a 5x5 grid around the selected point
	for (var i = (x - a); i < (x + a + 1); i++) {
		for (var j = (y - a); j < (y + a + 1); j++) {

			var grid = getGridSection(i, j);


			// Add to force if occupied:
			if (grid.square || grid.isWall) {
				var point = new Point(i, j);
				var vectorFromCenter = centerPoint - point;
				count++;
				force = force + vectorFromCenter;
			}
		}
	}
	// Scale it a bit
	return force / Math.pow(count, 1 / 2.4);
}


function step() {
	grid.forEach(moveSquare);
}

function moveSquare(oldLoc, i) {
	if (oldLoc.square) {
		var x = oldLoc.x;
		var y = oldLoc.y;
		var square = oldLoc.square;
		var force = getForceOfSurrounding(x, y);

		// Slow down
		square.velocity = square.velocity * 0.95;
		square.acceleration = force;

		// Add new acceleration
		square.velocity += square.acceleration;

		// Max speed
		if (square.velocity.length > maxSpeed) square.velocity.length = maxSpeed;

		// Internal floating location
		square.pos += square.velocity;

		var newLoc = getAffectedGridElement(x, y, square.velocity);


		if (!newLoc.square && !newLoc.isWall) {
			newLoc.square = oldLoc.square;
			oldLoc.square = false;

			updateGridElement(newLoc);
			updateGridElement(oldLoc);
		}
	}
}


function getAffectedGridElement(x, y, f) {
	var p = new Point(x, y);

	var dest = p + f;
	dest = dest.round();

	var gridElement = getGridSection(dest.x, dest.y);
	if (gridElement.isWall || gridElement.square) {
		// Try to half the force
		f = f / 2;
		dest = p + f;
		dest = dest.round();
		gridElement = getGridSection(dest.x, dest.y);
	}
	return gridElement;
}

function updateGridElement(gridElement) {
	var square = gridElement.square;
	if (square) {
		console.log(square, gridElement);
		square.screenElement.position.x = gridElement.x;
		square.screenElement.position.y = gridElement.y;
		square.debugElement.position.x = square.pos.x * size;
		square.debugElement.position.y = square.pos.y * size;
	}

}


function onMouseDown(e) {
	step();
}
