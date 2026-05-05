const diceImages = [
    "/static/dice/dice1.png",
    "/static/dice/dice2.png",
    "/static/dice/dice3.png",
    "/static/dice/dice4.png",
    "/static/dice/dice5.png",
    "/static/dice/dice6.png"
];

let musicStarted = false;

function startMusic() {
    if (!musicStarted) {
        const music = document.getElementById("bgMusic");
        music.volume = 0.3;
        music.play();
        musicStarted = true;
    }
}

async function updateState() {
    const res = await fetch("/state");
    const data = await res.json();

    document.getElementById("bankroll").innerText =
        "Bankroll: $" + data.bankroll;

    document.getElementById("point").innerText =
        data.in_round ? "Point: " + data.point : "No Point";
}

async function placeBet() {
    startMusic();

    const amount = parseInt(document.getElementById("betAmount").value);

    const res = await fetch("/bet", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({amount})
    });

    const data = await res.json();

    if (data.error) {
        alert(data.error);
    }

    updateLeaderboard();
    updateState();
}

function animateDice() {
    const die1 = document.getElementById("die1");
    const die2 = document.getElementById("die2");

    let count = 0;

    const interval = setInterval(() => {
        die1.src = diceImages[Math.floor(Math.random() * 6)];
        die2.src = diceImages[Math.floor(Math.random() * 6)];

        die1.classList.add("roll");
        die2.classList.add("roll");

        setTimeout(() => {
            die1.classList.remove("roll");
            die2.classList.remove("roll");
        }, 150);

        count++;
        if (count > 10) clearInterval(interval);
    }, 100);
}

async function rollDice() {
    startMusic();

    // Disable button to prevent spam clicks
    const button = event.target;
    button.disabled = true;

    // FIRST: get result from server
    const res = await fetch("/roll", { method: "POST" });
    const data = await res.json();

    // THEN: animate
    animateDice();

    // AFTER animation, show correct result
    setTimeout(() => {
        const die1 = document.getElementById("die1");
        const die2 = document.getElementById("die2");

        const d1 = data.dice[0];
        const d2 = data.dice[1];

        die1.src = diceImages[d1 - 1];
        die2.src = diceImages[d2 - 1];

        document.getElementById("result").innerText =
            `Roll: ${data.roll} → ${data.result}`;

        document.getElementById("bankroll").innerText =
            "Bankroll: $" + data.bankroll;

        document.getElementById("point").innerText =
            data.in_round ? "Point: " + data.point : "No Point";
        updateLeaderboard();

        button.disabled = false;
    }, 800);
}

async function resetGame() {
    await fetch("/reset", { method: "POST" });
    updateState();
    document.getElementById("result").innerText = "";
}
updateState();

async function setName() {
    const name = document.getElementById("playerName").value;

    if (!name) {
        alert("Enter a name!");
        return;
    }

    await fetch("/set_name", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name})
    });

    updateLeaderboard();
    updateState();
}

async function updateLeaderboard() {
    const res = await fetch("/leaderboard");
    const data = await res.json();

    const list = document.getElementById("leaderboard");
    list.innerHTML = "";

    data.forEach(([name, score]) => {
        const li = document.createElement("li");
        li.innerText = `${name}: $${score}`;
        list.appendChild(li);
    });
}
setInterval(updateLeaderboard, 3000);