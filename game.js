const canvas = document.getElementById('gameCanvas'),
      ctx = canvas.getContext('2d');
let ws, id = Date.now() + '-' + Math.floor(Math.random()*1000),
    name, players = {}, obstacles = [], timeLeft = 0;

canvas.width = window.innerWidth; canvas.height = window.innerHeight;

function start() {
  name = document.getElementById('nameInput').value.trim();
  if (!name) return alert('Enter a name');
  document.getElementById('loginScreen').style.display='none';
  canvas.style.display='block';

ws = new WebSocket('wss://tagarena-backend.onrender.com');
  ws.onopen = () => ws.send(JSON.stringify({ type:'join', id, name }));
  ws.onmessage = m => handleMsg(JSON.parse(m.data));

  window.addEventListener('keydown', e=>moveBtn(e, true));
  window.addEventListener('keyup', e=>moveBtn(e, false));
}

let vx=0, vy=0, keys={};
function moveBtn(e, down) {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
    keys[e.code] = down;
    vx = (!!keys.ArrowRight||!!keys.KeyD) - (!!keys.ArrowLeft||!!keys.KeyA);
    vy = (!!keys.ArrowDown||!!keys.KeyS) - (!!keys.ArrowUp||!!keys.KeyW);
    if (ws) ws.send(JSON.stringify({ type:'move', id, vx, vy }));
  }
}

function handleMsg(msg) {
  if (msg.type === 'startRound') {
    obstacles = msg.obstacles;
    players = {};
    timeLeft = 180;
  }
  if (msg.type === 'state') {
    players = msg.players;
    timeLeft = msg.timeLeft;
    draw();
  }
  if (msg.type === 'endRound') {
    draw();
    const winner = Object.values(msg.players).sort((a,b)=>b.score-a.score)[0];
    setTimeout(()=>alert(`🏆 Winner: ${winner.name} (${winner.score})`),10);
    window.location.reload();
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // camera centered on player
  const me = players[id];
  const cx = me ? me.x - canvas.width/2 : 0;
  const cy = me ? me.y - canvas.height/2 : 0;
  ctx.save();
  ctx.translate(-cx, -cy);
  // bg
  ctx.fillStyle = '#eee';
  ctx.fillRect(0,0,3200,1600);
  // obstacles
  ctx.fillStyle = '#444';
  obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.w,o.h));
  // players
  Object.values(players).forEach(p=> {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, 2*Math.PI);
    ctx.fillStyle = p.isIt ? 'red' : 'blue';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText(p.name, p.x - p.radius, p.y - p.radius - 5);
  });
  ctx.restore();
  // timer
  ctx.fillStyle = '#000'; ctx.font = '20px sans-serif';
  ctx.fillText('Time: ' + Math.ceil(timeLeft), 20, 30);
  // leaderboard
  const top = Object.values(players).sort((a,b)=>b.score-a.score).slice(0,5);
  top.forEach((p,i)=>{
    ctx.fillText(`${i+1}. ${p.name}: ${p.score}`, 20, 60 + i*20);
  });
}
