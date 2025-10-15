// --- Utility Functions ---
function dist2(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
}
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// --- Globals ---
let x = window.innerWidth / 2;
let y = window.innerHeight / 2;
let vx = (Math.random() - 0.5) * 4;
let vy = (Math.random() - 0.5) * 4;
let target = null;

const foodColors = ['#4fc3f7', '#ffb74d', '#81c784', '#e57373'];
const feeders = [];
const foodParticles = [];
const trailParticles = [];
const TRAIL_DURATION = 2000; // ms

// --- DOM Elements ---
const dot = document.createElement('div');
dot.style.position = 'fixed';
dot.style.width = '20px';
dot.style.height = '20px';
dot.style.background = 'black';
dot.style.borderRadius = '50%';
dot.style.left = '50vw';
dot.style.top = '50vh';
dot.style.zIndex = 10000;
document.body.appendChild(dot);

// --- Food Color Behaviors ---
const foodBehaviors = [
    // Blue: heads toward pet
    function(f) {
        const dx = x - f.x, dy = y - f.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 1) {
            f.vx += (dx / d) * 0.03;
            f.vy += (dy / d) * 0.03;
        }
    },
    // Orange: bouncy, jittery
    function(f) {
        f.vx += (Math.random() - 0.5) * 0.2;
        f.vy += (Math.random() - 0.5) * 0.2;
    },
    // Green: floats, slow gravity, drifts sideways
    function(f) {
        f.vy -= 0.01;
        f.vx += (Math.random() - 0.5) * 0.05;
    },
    // Red: sticks together (follow the leader)
    function(f, idx) {
        let minD = 1e9, nearest = null;
        for (let i = 0; i < foodParticles.length; i++) {
            if (i !== idx && foodParticles[i].color === f.color) {
                const d = dist2(f, foodParticles[i]);
                if (d < minD) {
                    minD = d;
                    nearest = foodParticles[i];
                }
            }
        }
        if (nearest && minD < 4000) {
            f.vx += (nearest.x - f.x) * 0.001;
            f.vy += (nearest.y - f.y) * 0.001;
        }
    }
];

// --- Event Listeners ---
function setTarget(e) {
    let clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    target = { x: clientX, y: clientY };
}
window.addEventListener('click', setTarget);
window.addEventListener('touchstart', setTarget);

// --- Feeders ---
foodColors.forEach((color, i) => {
    const feeder = document.createElement('div');
    feeder.style.position = 'fixed';
    feeder.style.left = `${20 + i * 40}px`;
    feeder.style.top = '20px';
    feeder.style.width = '24px';
    feeder.style.height = '24px';
    feeder.style.background = color;
    feeder.style.borderRadius = '50%';
    feeder.style.border = '2px solid #fff';
    feeder.style.boxShadow = '0 0 6px #0003';
    feeder.style.cursor = 'pointer';
    feeder.style.zIndex = 10001;
    document.body.appendChild(feeder);
    feeders.push(feeder);

    function sprinkle(e) {
        e.stopPropagation();
        let sprinkleCount = 10;
        for (let j = 0; j < sprinkleCount; j++) {
            const angle = Math.random() * 2 * Math.PI;
            const dist = 40 + Math.random() * 30;
            const fx = feeder.getBoundingClientRect().left + 12 + Math.cos(angle) * dist;
            const fy = feeder.getBoundingClientRect().top + 12 + Math.sin(angle) * dist;
            const foodEl = document.createElement('div');
            foodEl.style.position = 'fixed';
            foodEl.style.left = `${fx}px`;
            foodEl.style.top = `${fy}px`;
            foodEl.style.width = '10px';
            foodEl.style.height = '10px';
            foodEl.style.background = color;
            foodEl.style.borderRadius = '50%';
            foodEl.style.opacity = '0.85';
            foodEl.style.zIndex = 10002;
            document.body.appendChild(foodEl);

            foodParticles.push({
                x: fx,
                y: fy,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                color,
                life: 300 + Math.random() * 700,
                el: foodEl
            });
        }
    }
    feeder.addEventListener('click', sprinkle);
    feeder.addEventListener('touchstart', sprinkle);
});

// --- Trail System ---
function addTrail(color) {
    const now = Date.now();
    const tEl = document.createElement('div');
    tEl.style.position = 'fixed';
    tEl.style.width = '10px';
    tEl.style.height = '10px';
    tEl.style.background = color;
    tEl.style.borderRadius = '50%';
    tEl.style.opacity = '0.4';
    tEl.style.zIndex = 9999;
    document.body.appendChild(tEl);

    trailParticles.push({
        color,
        created: now,
        x,
        y,
        el: tEl
    });
}

// --- Main Animation Loop ---
function animate() {
    // --- Pet Movement ---
    if (target) {
        const dx = target.x - x;
        const dy = target.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
            vx += (dx / dist) * 0.2;
            vy += (dy / dist) * 0.2;
        } else {
            target = null;
        }
    } else {
        vx += (Math.random() - 0.5) * 0.5;
        vy += (Math.random() - 0.5) * 0.5;
    }
    vx = clamp(vx, -3, 3);
    vy = clamp(vy, -3, 3);
    x += vx;
    y += vy;
    if (x < 0) { x = 0; vx *= -1; }
    if (y < 0) { y = 0; vy *= -1; }
    if (x > window.innerWidth - 20) { x = window.innerWidth - 20; vx *= -1; }
    if (y > window.innerHeight - 20) { y = window.innerHeight - 20; vy *= -1; }
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;

    // --- Food Physics and Collisions ---
    for (let i = foodParticles.length - 1; i >= 0; i--) {
        const f = foodParticles[i];
        const colorIdx = foodColors.indexOf(f.color);
        if (foodBehaviors[colorIdx]) foodBehaviors[colorIdx](f, i);

        // Move food
        f.x += f.vx;
        f.y += f.vy;
        if (colorIdx !== 2) f.vy += 0.02; // gravity except green

        // Wall collisions
        if (f.x < 0) { f.x = 0; f.vx *= -0.6; }
        if (f.x > window.innerWidth - 10) { f.x = window.innerWidth - 10; f.vx *= -0.6; }
        if (f.y < 0) { f.y = 0; f.vy *= -0.6; }
        if (f.y > window.innerHeight - 10) {
            f.y = window.innerHeight - 10;
            f.vy *= -0.3;
            f.vx *= 0.7;
            if (Math.abs(f.vy) < 0.2) f.vy = 0;
            if (Math.abs(f.vx) < 0.05) f.vx = 0;
        }

        // Food-food collision (simple elastic)
        for (let j = i - 1; j >= 0; j--) {
            const f2 = foodParticles[j];
            const dx = f.x - f2.x, dy = f.y - f2.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 100) {
                const d = Math.sqrt(d2) || 1;
                const overlap = 10 - d;
                f.x += (dx / d) * (overlap / 2);
                f.y += (dy / d) * (overlap / 2);
                f2.x -= (dx / d) * (overlap / 2);
                f2.y -= (dy / d) * (overlap / 2);
                // Exchange velocity
                const tx = f.vx, ty = f.vy;
                f.vx = f2.vx; f.vy = f2.vy;
                f2.vx = tx; f2.vy = ty;
            }
        }

        f.el.style.left = `${f.x}px`;
        f.el.style.top = `${f.y}px`;
        f.el.style.opacity = `${Math.max(0, f.life / 1000)}`;

        // Pet eats food if close
        const dx = f.x - x, dy = f.y - y;
        if (dx * dx + dy * dy < 400) {
            addTrail(f.color);
            document.body.removeChild(f.el);
            foodParticles.splice(i, 1);
            continue;
        }
        // Remove if expired
        f.life -= 1;
        if (f.life <= 0) {
            document.body.removeChild(f.el);
            foodParticles.splice(i, 1);
        }
    }

    // --- Trail Effect ---
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const t = trailParticles[i];
        const age = Date.now() - t.created;
        t.el.style.left = `${x + Math.random() * 10 - 5}px`;
        t.el.style.top = `${y + Math.random() * 10 - 5}px`;
        t.el.style.opacity = `${0.4 * (1 - age / TRAIL_DURATION)}`;
        t.el.style.width = t.el.style.height = `${8 - 6 * (age / TRAIL_DURATION)}px`;
        if (age > TRAIL_DURATION) {
            document.body.removeChild(t.el);
            trailParticles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

animate();