const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRaceCode(): string {
	let code = '';
	for (let i = 0; i < 4; i++) {
		code += CHARS[Math.floor(Math.random() * CHARS.length)];
	}
	return code;
}

export function isValidRaceCode(code: string): boolean {
	return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(code.toUpperCase());
}
