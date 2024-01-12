#!/usr/bin/env -S pkgx bun

function printChristmasTree(height: number): void {
	for (let i = 1; i <= height; i++) {
		let spaces = " ".repeat(height - i);
		let stars = "*".repeat(i * 2 - 1);
		console.log(spaces + stars);
	}
}

printChristmasTree(parseInt(process.argv[2] ?? "5"));