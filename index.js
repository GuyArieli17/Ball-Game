
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const scoreElement = document.querySelector('#score');
const restartBtnElement= document.querySelector('#restartBtn');
const endGameElement= document.querySelector('#endGameBoard');
const endGameScoreElement = document.querySelector('#endGameScore');
var ENEMIES_VELOCITY_FACTOR = 1.5;
var PLAYER_VELOCITY_FACTOR = 5;
var PARTICL_VELOCITY_FACTOR = 5;


  
class Player{
    constructor(x,y,radius,color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.projectiles = [];
    }

    addProjectile(projectile){
        this.projectiles.push(projectile);
    }

    drawPlayer(context){
        // Draw player
        context.beginPath();
        context.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        context.fillStyle = this.color;
        context.fill();
    }

    draw(context){
        this.drawPlayer(context);
        this.projectiles.forEach(projectile => {
            projectile.draw(context);
            projectile.update();
        });
    }

    hasHitEnemy(enemy){
        let hasHit = -1;
        this.projectiles.forEach((projectile,index)=>{
            const distance = Math.hypot(projectile.x - enemy.x,projectile.y - enemy.y);
            if(distance-enemy.radius-this.radius < 1){hasHit = index;}
            if(projectile.x - projectile.radius < 0 || projectile.y - projectile.radius<0){
                this.projectiles.splice(index,1);
            }
        });
        return hasHit;
    }

    removeProjectileAtIndex(index){
        this.projectiles.splice(index, 1);
    }

    removeProjectilesOutOfWindow(size){
        this.projectiles.forEach((projectile,index)=>{
            if (projectile.x + projectile.radius < 0 || 
                projectile.x - projectile.radius > size.width || 
                projectile.y + projectile.radius < 0 || 
                projectile.y - projectile.radius > size.height){
                    this.removeProjectileAtIndex(index);
                }
        });
    }

}
// make canvas fill window
canvas.width = innerWidth;
canvas.height = innerHeight;
class Projectile{
    constructor(x,y,radius,color,velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw(context){
        context.beginPath();
        context.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        context.fillStyle = this.color;
        context.fill();
    }

    update(){
        this.x += this.velocity.x * PLAYER_VELOCITY_FACTOR;
        this.y += this.velocity.y * PLAYER_VELOCITY_FACTOR;
    }
}
class Enemy{
    constructor(x,y,radius,color,velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw(context){
        context.beginPath();
        context.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        context.fillStyle = this.color;
        context.fill();
    }

    update(){
        this.x += this.velocity.x * ENEMIES_VELOCITY_FACTOR;
        this.y += this.velocity.y * ENEMIES_VELOCITY_FACTOR;
    }

    hasHitPlayer(player){
        return Math.hypot(player.x - this.x,player.y-this.y) < player.radius + this.radius;
    }

}
var FRICION = 0.987;
class Particle{
    constructor(x,y,radius,color,velocity){
        this.alpha = 1;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw(context){
        context.save();
        context.globalAlpha = this.alpha;
        context.beginPath();
        context.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        context.fillStyle = this.color;
        context.fill();
        context.restore();
    }

    update(){
        this.velocity.x *= FRICION;
        this.velocity.y *= FRICION;
        this.x += this.velocity.x * PARTICL_VELOCITY_FACTOR;
        this.y += this.velocity.y * PARTICL_VELOCITY_FACTOR;
        this.alpha -= 0.01;
    }

    hasHitPlayer(player){
        return Math.hypot(player.x - this.x,player.y-this.y) < player.radius + this.radius;
    }

}
var MAX_ENEMY_SIZE = 50;
var MIN_ENEMY_SIZE = 20;
var PLAYER_COLOR = 'white'
var PLAYER_SIZE = 10;
var PROJECTILE_COLOR = 'white';
var NUMBER_OF_PARTICLES = 8;
var ENEMY_SPEED_AC= 1.01;
class Game{
    
    constructor(canvas,context){
        // set player position
        const player_x = canvas.width/2;
        const player_y = canvas.height/2;
        // create player
        this.player = new Player(player_x,player_y,PLAYER_SIZE,PLAYER_COLOR);
        this.context = context;
        this.canvas = canvas;
        this.score = 0;
        this.enemeySpeed = 1000;
        this.enemies = [];
        this.particles = []
        this.animationId = -1;
        this.animate = () => {
            this.animationId = requestAnimationFrame(this.animate);
            this.context.fillStyle = 'rgba(0,0,0,0.3)'
            this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
            this.player.removeProjectilesOutOfWindow({width: this.canvas.width, height: this.canvas.height});
            this.player.draw(this.context);
            this.particles.forEach((particle,index)=>{
                if(particle.alpha <= 0 ){
                    this.particles.splice(index,index)
                }
                else{
                    particle.draw(this.context);
                    particle.update();
                }
            });
            this.enemies.forEach((enemy,index) => {
                enemy.update();
                enemy.draw(this.context);
                const projectIndex = this.player.hasHitEnemy(enemy);
                const hasHitPlayer = enemy.hasHitPlayer(this.player);
                if(projectIndex != -1){
                    for (let index = 0; index < NUMBER_OF_PARTICLES; index++) {
                        const projectile = this.player.projectiles[projectIndex];
                        const particle = new Particle(
                            projectile.x,
                            projectile.y,
                            Math.random()*NUMBER_OF_PARTICLES/2,
                            enemy.color,
                            {
                                x: (Math.random() - .5) * (Math.random()*2),
                                y: (Math.random() - .5) * (Math.random()*2),
                            }
                        );
                        this.particles.push(particle);
                    }
                    this.player.removeProjectileAtIndex(projectIndex);
                    if(enemy.radius >= (MAX_ENEMY_SIZE*8)/10){
                        gsap.to(enemy,{
                            radius: enemy.radius/2,
                            duration: 0.3,
                        });
                        this.score += MIN_ENEMY_SIZE;
                    }
                    else{
                        setTimeout(() =>{
                            this.enemies.splice(index,1);
                            //increase our screen
                            this.score +=Math.round(enemy.radius);
                            scoreElement.innerHTML = this.score;

                        },0);
                    }

                }
                if(hasHitPlayer){
                    cancelAnimationFrame(this.animationId);
                    endGameScoreElement.innerHTML = this.score;
                    endGameElement.style.display = 'flex';

                }

            });
        };
        
    }

    start(){
        // set player position
        const player_x = canvas.width/2;
        const player_y = canvas.height/2;
        // create player
        this.player = new Player(player_x,player_y,PLAYER_SIZE,PLAYER_COLOR);
        this.score = 0;
        this.enemies = [];
        this.particles = []
        this.animationId = -1;
        this.player.draw(this.context)
        game.spwanEnemies();
    }

    // Mannager - shoot projectile from player
    shootFromPlayer(event){
        let angle = Math.atan2(
            event.clientY - this.canvas.height/2,
            event.clientX - this.canvas.width/2
        ); 
        let velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle),
        };
        const projectile = new Projectile(this.player.x,this.player.y,5,PROJECTILE_COLOR,velocity);
        this.player.addProjectile(projectile);
    }

    // Mannager - spwan enemyes
    spwanEnemies(){
        setInterval(()=>{
            const radius = Math.random() * (MAX_ENEMY_SIZE-MIN_ENEMY_SIZE) + MIN_ENEMY_SIZE;
            let x = Math.random() * this.canvas.width;
            let y = Math.random() * this.canvas.height;
            if(Math.random() > 0.5){
                x = Math.random() < .5 ? 0-radius : this.canvas.width + radius;
            }
            else{
                y = Math.random() < .5 ? 0-radius : this.canvas.height + radius;
            }
         
            let angle = Math.atan2(
                this.canvas.height/2-y,
                this.canvas.width/2-x
            ); 
            let velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle),
            };
            const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
            const enemy = new Enemy(x,y,radius,color,velocity);
            this.enemies.push(enemy);
        },1050)
    }

}

let game = new Game(canvas,context);
endGameElement.style.display = 'none';
game.start();
game.animate();


// On click lisiner
addEventListener('click',(e)=>{
    game.shootFromPlayer(e);
})

restartBtnElement.addEventListener('click',(e)=>{
    //draw player
    game.start();
    scoreElement.innerHTML = game.score;
    game.spwanEnemies();
    game.animate();
    endGameElement.style.display = 'none';
});
