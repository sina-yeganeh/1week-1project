import kaplay from "kaplay"
import "kaplay/global"

kaplay({
	font: "rainyhearts",
	scale: 5
})

loadFont("rainyhearts", "/src/assets/fonts/rainyhearts.ttf")
loadShaderURL("crt", null, "/src/assets/shader/crt.frag")

usePostEffect("crt")

setBackground(Color.WHITE)

loadSprite("a", "/src/assets/sprites/running.png", {
	sliceX: 7,
	anims: {
		"run": {
			from: 0,
			to: 4,
			speed: 7,
			loop: true
		},
		"idle": {
			from: 5,
			to: 6,
			speed: 3,
			loop: true
		}
	}
})

loadSprite("bullet", "/src/assets/sprites/bullet.png")

var numbers = ["one", "two", "three"]
numbers.forEach(number => {
	loadSprite(`${number}`, `/src/assets/sprites/${number}.png`)
})

loadSound("shoot", "/src/assets/sounds/shoot.wav")
loadSound("explosion", "/src/assets/sounds/explosion.wav")
loadSound("dash", "/src/assets/sounds/dash.wav")

scene("game", () => {
	let playerSpeed = 120
	let enemyBaseSpeed = 100
	var pointValue = 0

	const point = add([
		text(`POINT: ${pointValue}`),
		pos(10, 10),
		color(Color.BLACK),
		scale(0.5)
	])

	const player = add([
		sprite("a"),
		pos(center()),
		area(),
		anchor("center"),
		"player"
	])

	player.play("idle")

	// Movement system
	onKeyDown("a", () => {
    player.move(-playerSpeed, 0)
    player.flipX = true
		if (player.getCurAnim() !== "run") {
			player.play("run")
		}
	})

	onKeyDown("d", () => {
		player.move(playerSpeed, 0)
		player.flipX = false
		if (player.getCurAnim() !== "run") {
			player.play("run")
		}
	})

	onKeyDown("w", () => {
		player.move(0, -playerSpeed)
		player.flipX = false
		if (player.getCurAnim() !== "run") {
			player.play("run")
		}
	})

	onKeyDown("s", () => {
		player.move(0, playerSpeed)
		player.flipX = false
		if (player.getCurAnim() !== "run") {
			player.play("run")
		}
	})

	let keys = ["w", "s", "d", "a"]
	keys.forEach(key => {
		onKeyRelease(key, () => {
			if (!isKeyDown("w") && !isKeyDown("s") && !isKeyDown("d") && !isKeyDown("a")) {
				player.play("idle")
			}
		})
	})

	// Dash
	onKeyPress("shift", () => {
		let dir = mousePos().sub(player.worldPos()).unit()
		player.move(dir.scale(7000))
		play("dash")
	})

	// Shooting system
	function bulletDestruction() {
		return {
			id: "bulletDestruction",
			require: ["pos"],
			update() {
				const spos = this.screenPos();
				if (
					spos.x < 0
					|| spos.x > width()
					|| spos.y < 0
					|| spos.y > height()
				) {
					this.trigger("out");
				}
			}
		}
	}	

	onClick(() => {
		let playerPos = player.worldPos()
		let mPos = mousePos()

		play("shoot")
		add([
			pos(playerPos),
			sprite("bullet"),
			area(),
			anchor("center"),
			"bullet",
			{ dir: mPos.sub(playerPos).unit() },

			bulletDestruction()
		])
	})

	onUpdate("bullet", bullet => {
		bullet.move(bullet.dir.scale(300))
	})

	// Tutoiral
	const tutorialText = add([
		text("W/A/S/D  TO MOVE\nSHIT  TO DASH\nRIGHT CLICK  TO SHOOT"),
		pos(center()),
		color(Color.BLACK),
		anchor("center"),
		scale(0.3)
	])

	wait(10, () => {
		tutorialText.destroy()

		// Enemy spawing system
		let numberToString = {
			"1": "one",
			"2": "two",
			"3": "three",
			"4": "four",
			"5": "five"
		}

		let randN = 1
		let numberOfNumber = 5
		let waveTime = 10
		let wave = 1
		loop(waveTime, () => {
			for (let i = 1; i <= numberOfNumber; i++) {
				if (randN === 1) {
					var number = 1
				} else {
					var number = Math.floor(Math.random() * (randN - 1) + 1)
				}

				let x = 0
				if (Math.random() > 0.5) {
					x = width()
				}
				let randomPos = (
					x, Math.random() * (height())
				)
				
				const enemy = add([
					sprite(`${numberToString[number]}`),
					area(),
					anchor("center"),
					pos(randomPos),
					health(number),
					body(),
					"enemy",
					"badStuff"
				])

				enemy.onDeath(() => {
					enemy.destroy()
				})
			}

			randN += 1
			wave += 1
			waveTime += 3
			numberOfNumber += 3
		})

		onUpdate("enemy", enemy => {
			if (!player.exists()) return

			let dir = player.pos.sub(enemy.pos).unit()
			enemy.move(dir.scale(enemyBaseSpeed))
		})

		onCollide("enemy", "bullet", (enemy, bullet) => {
			play("explosion")
			enemy.hurt(1)
			pointValue += 1
			point.text = `POINT: ${pointValue}`
			// enemy.spirte(`${enemy.health()}`)

			bullet.destroy()
		})
	})

	onCollide("badStuff", "player", (_, player) => {
		player.destroy()
		go("lose", { score: pointValue })
	})
})

scene("lose", ({ score }) => {
	add([
		text(` GAME OVER!\nYOUR SCORE: ${score}`),
		color(Color.BLACK),
		scale(0.5),
		pos(center()),
		anchor("center")
	])
})

go("game")
