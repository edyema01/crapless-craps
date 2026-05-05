from flask import Flask, render_template, request, jsonify, session
import random

app = Flask(__name__)
app.secret_key = "craps_secret_key"

MIN_BET = 3
MAX_BET = 20
STARTING_BANKROLL = 100

# Global leaderboard (shared across all players)
leaderboard = {}

def init_game():
    session["bankroll"] = STARTING_BANKROLL
    session["point"] = None
    session["bet"] = 0
    session["in_round"] = False
    session["name"] = None

def roll_dice():
    die1 = random.randint(1, 6)
    die2 = random.randint(1, 6)
    return die1, die2

def update_leaderboard(name, bankroll):
    if name:
        leaderboard[name] = bankroll

@app.route("/")
def index():
    if "bankroll" not in session:
        init_game()
    return render_template("index.html")

@app.route("/set_name", methods=["POST"])
def set_name():
    name = request.json.get("name")
    session["name"] = name
    update_leaderboard(name, session["bankroll"])
    return jsonify({"success": True})

@app.route("/leaderboard")
def get_leaderboard():
    sorted_board = sorted(leaderboard.items(), key=lambda x: x[1], reverse=True)
    return jsonify(sorted_board[:10])  # top 10

@app.route("/state")
def state():
    return jsonify({
        "bankroll": session.get("bankroll", STARTING_BANKROLL),
        "point": session.get("point"),
        "in_round": session.get("in_round"),
        "name": session.get("name")
    })

@app.route("/bet", methods=["POST"])
def bet():
    amount = request.json.get("amount")

    if amount < MIN_BET or amount > MAX_BET:
        return jsonify({"error": f"Bet must be between ${MIN_BET} and ${MAX_BET}"}), 400

    if amount > session["bankroll"]:
        return jsonify({"error": "Not enough bankroll"}), 400

    session["bet"] = amount
    session["bankroll"] -= amount

    update_leaderboard(session["name"], session["bankroll"])
    return jsonify({"success": True})

@app.route("/roll", methods=["POST"])
def roll():
    die1, die2 = roll_dice()
    roll = die1 + die2

    if not session["in_round"]:
        if roll in [7, 11]:
            session["bankroll"] += session["bet"] * 2
            result = "win"
        else:
            session["point"] = roll
            session["in_round"] = True
            result = f"Point: {roll}"
    else:
        if roll == 7:
            session["in_round"] = False
            result = "lose"
        elif roll == session["point"]:
            session["bankroll"] += session["bet"] * 2
            session["in_round"] = False
            result = "win"
        else:
            result = "roll again"

    update_leaderboard(session["name"], session["bankroll"])

    return jsonify({
        "roll": roll,
        "dice": [die1, die2],
        "result": result,
        "bankroll": session["bankroll"],
        "point": session["point"],
        "in_round": session["in_round"]
    })

@app.route("/reset", methods=["POST"])
def reset():
    name = session.get("name")
    init_game()
    session["name"] = name  # keep same player name
    update_leaderboard(name, session["bankroll"])
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run()