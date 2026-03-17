const ADJECTIVES = [
	'Blazing', 'Midnight', 'Golden', 'Reckless', 'Electric',
	'Savage', 'Iron', 'Neon', 'Thunder', 'Crimson',
	'Shadow', 'Turbo', 'Frozen', 'Chaos', 'Ultimate',
	'Furious', 'Wild', 'Epic', 'Grand', 'Legendary'
];

const NOUNS = [
	'Dash', 'Sprint', 'Marathon', 'Showdown', 'Challenge',
	'Gauntlet', 'Derby', 'Rally', 'Blitz', 'Rampage',
	'Pursuit', 'Scramble', 'Stampede', 'Throwdown', 'Chase',
	'Rush', 'Frenzy', 'Brawl', 'Charge', 'Clash'
];

export function generateRaceName(): string {
	const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
	const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
	return `${adj} ${noun}`;
}
