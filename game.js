const MAPS = {
	0:	{
		name:'the begin is here!',
		map:'empty'
		},
	1:	{
		name:'level 2',
		map:[
		'..............##..............',
		'..............##..............'
		]},
	2:	{
		name:'cooltowm',
		map:[
		'............#####.............',
		'................#.............',
		'........###.....#.............'
		]},
	3:	{
		name:'tree',
		map:[
		'...............#..............',
		'.........##########...........',
		'...............##.............',
		'...............##.............',
		'...........########...........',
		'..............###.............',
		'.............####..............'
		]}
} 

const MAX_ROOMS = 3;
const COLORS = {
	grey1	:'#9f9f9f',
	grey2	:'#787878',
	grey3	:'#5f5f5f',
	red		:'#f83800',
	blue	:'#008888'
}

const C_WIDTH = 600, C_HEIGHT = 400;
const PX_SIZE = 4;
const GRID = PX_SIZE*5;

const LEFT=37,RIGHT=39,UP=38,DOWN=40; 
const GROUND = C_HEIGHT-GRID*6;

var textWindow = document.getElementById('levelText');
var canvas = document.getElementById('gamewindow'),
    ctx = canvas.getContext('2d');
canvas.width = C_WIDTH;
canvas.height = C_HEIGHT;
function randomINT(max){
	return Math.floor(Math.random()* (max+1));
}
function toZero(number, decay) {
    if (number == 0) return 0;
    const sign = Math.sign(number);
    number = Math.abs(number);
    number = Math.max(number - decay, 0);
    return number * sign;
  }
function clampValue(number,min,max){
	return Math.max(Math.min(number,max),min)
}
function collide(dx,dy,obj1,obj2){
	const a = obj1.pos;
	for (let i = 0; i < obj2.length; i++){
		const b = obj2[i].pos;
		if (a.x + a.w + dx < b.x || a.x + dx > b.x + b.w) continue;
		if (a.y + a.h + dy < b.y || a.y + dy > b.y + b.h) continue;
		return b;
	}
	return 0;
}
class Level{
	constructor(){
		this.currentRoom = 0;
		this.resetRoom();
		this.buildRoom(MAPS[0])
	}
	buildRoom(pattern){
		textWindow.innerHTML = pattern.name;
		if (pattern.map == 'empty') return;
		let drawPosition = GROUND - pattern.map.length * GRID;
		for (let row = 0; row < pattern.map.length; row++){
			for(let col = 0; col < pattern.map[0].length; col++){
				switch(pattern.map[row][col]){
					case '#':
					this.walls.push(new Wall(col*GRID,drawPosition))
					break;
				}
			}
			drawPosition += GRID
		}
	}
	gotoNextRoom(){
		this.resetRoom();
		this.currentRoom = Math.min(this.currentRoom+1,MAX_ROOMS)
		this.buildRoom(MAPS[this.currentRoom])
	}
	resetRoom(){
		this.walls = [];
	}
}

class Block{
	constructor(x,y,w,h,offsetX,offsetY,color='white'){
		this.color = color;
		this.pos = {x:x,y:y,w:w,h:h,offsetX:offsetX,offsetY:offsetY}
	}
	draw(){
		ctx.fillStyle = this.color;
		const p = this.pos;
		ctx.fillRect(p.x-p.offsetX,p.y-p.offsetY,p.w+p.offsetX*2,p.h+p.offsetY*2)
		//this.collisionBox();
	}
	collisionBox(){
		ctx.fillStyle = 'red';
		const p = this.pos;
		ctx.fillRect(p.x,p.y,p.w,p.h)
	}
	
}
class Wall extends Block{
	constructor(x,y){
		super(x,y,GRID,GRID,0,0,COLORS.grey3)
		this.colors = [COLORS.grey1,COLORS.grey2];
		this.setPixels()
	}
	draw(){
		super.draw();
		this.pixels.forEach(pixel => {
			ctx.fillStyle = this.colors[pixel[2]];
			ctx.fillRect(	this.pos.x + pixel[0],
							this.pos.y + pixel[1],
							PX_SIZE,PX_SIZE);
		})
	}
	setPixels(){
		this.pixels = [];
		for (let i=0; i<10; i++){
			const x = randomINT(4)*PX_SIZE;
			const y = randomINT(4)*PX_SIZE;
			const color = randomINT(1)
			this.pixels.push([x,y,color])
		}
	}
}
class Player extends Block{
	constructor(color,x,y,controlDirection){
		super(x,y,GRID/2,GRID/2,GRID/4,GRID/4,color)
		this.xSpeed = this.ySpeed = 0;
		this.isOnGround = 0;
		this.direction = controlDirection;
		this.sprite= [[1*PX_SIZE,2*PX_SIZE,3*PX_SIZE,1*PX_SIZE],[2*PX_SIZE,1*PX_SIZE,1*PX_SIZE,3*PX_SIZE]];
	}
	draw(){
		//draw square
		super.draw();
		
		//draw plus or minus symbol on player
		ctx.fillStyle = 'white';
		const imgNum = 1 + (this.direction==1);
		const x = this.pos.x - this.pos.offsetX
		const y = this.pos.y - this.pos.offsetY
		for (let i=0; i < imgNum; i++){
		const s = this.sprite[i];
		ctx.fillRect(x + s[0], y + s[1], s[2], s[3])
		}
	}
	update(){
		this.jumpCheck();
		this.checkSpeedY();
		this.checkSpeedX();
		this.reduceSpeed();
		this.positionCheckX();
		this.positionCheckY();
		
	}
	jumpCheck(){
		const minJump = -4
		const jumpSpeed = -10
		if (x_press){
			if (this.isOnGround){
				this.ySpeed = jumpSpeed;
				this.isOnGround = 0;
			}
		}
		else if(!controller.getkey(88) && this.ySpeed < minJump) this.ySpeed = minJump;
	}
	checkSpeedX(){
		const speed = .60;
		const maxSpeed = 4.2;
		const horizontal = this.direction*(controller.getkey(RIGHT) - controller.getkey(LEFT));
		this.xSpeed += horizontal * speed;
		this.xSpeed = clampValue(this.xSpeed,-maxSpeed,maxSpeed)
	}
	checkSpeedY(){
		const grav = .5;
		const maxSpeed = 8;
		this.ySpeed += grav;
		this.ySpeed = clampValue(this.ySpeed,-maxSpeed,maxSpeed)
	}
	reduceSpeed(){
		const friction = .4;
		this.xSpeed = toZero(this.xSpeed,friction)
	}
	positionCheckX(){
		const obj = collide(this.xSpeed,0,this,GAME.getWalls())
		if (obj) {
			this.pos.x = Math.floor(this.pos.x)
			if (this.pos.x < obj.x) this.pos.x = obj.x - this.pos.w - 1;
			else this.pos.x = obj.x + obj.w + 1;
			this.xSpeed = 0;
		}
		this.pos.x += this.xSpeed;
		
		if (this.pos.x < 0) this.pos.x = 0
		else if(this.pos.x + this.pos.w > C_WIDTH) this.pos.x = C_WIDTH - this.pos.w;
	}
	positionCheckY(){
		const obj = collide(0,this.ySpeed,this,GAME.getWalls())
		if (obj){
			this.pos.y = Math.floor(this.pos.y)
			if (this.pos.y < obj.y) {
				this.pos.y = obj.y - this.pos.h-1;
				this.isOnGround = 1;
			}
			else this.pos.y = obj.y + obj.h + 1;
			this.ySpeed = 0;
		}
		if(this.ySpeed > 1) this.isOnGround = 0;
		this.pos.y += this.ySpeed;
		if (this.pos.y + this.pos.h >= GROUND){
			this.pos.y = GROUND - this.pos.h - this.pos.offsetY
			this.isOnGround = 1;
		}
	}
}
function drawGround(){
	const colors = [COLORS.grey1,COLORS.grey2,COLORS.grey3]
	const offset = GRID/2;
	for(i=0; i<3; i++){
		const ground = GROUND+i*offset
		ctx.fillStyle=colors[i]
		ctx.fillRect(0,ground,C_WIDTH,C_HEIGHT-ground)
	}
	
	
}

class GameControl{
  constructor(){
	  this.player = new Player(COLORS.red,GRID*4,GRID*10, 1);
	  this.player2= new Player(COLORS.blue,GRID*26,GRID*10,-1);
	  this.LEVEL = new Level();
  }
  update(){
	  this.player.update();
	  this.player2.update();
	  this.checkPlayerCollision()
  }
  draw(){
	   
	  this.player.draw();
	  this.player2.draw();
	  
	  this.getWalls().forEach(wall => wall.draw())
	  drawGround();
  }
  getWalls(){
	  return this.LEVEL.walls;
  }
  checkPlayerCollision(){
	  if (collide(0,0,this.player,[this.player2])){
		this.LEVEL.gotoNextRoom();
		this.resetPlayer(this.player, GRID*4);
		this.resetPlayer(this.player2,GRID*26);
	  }
  }
  resetPlayer(player,x){
	  player.pos.x = x;
	  player.pos.y = GRID*10;
  }
}
var x_press = 0;
function mainloop(){
	x_press = controller.getkeypress(88)
	requestAnimationFrame(mainloop)
	ctx.clearRect(0,0,canvas.width,canvas.height)
	GAME.update();
	GAME.draw();
	x_press = 0;
}
var GAME = new GameControl()
mainloop()