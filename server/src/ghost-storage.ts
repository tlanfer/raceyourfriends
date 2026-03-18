import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { GhostRun } from './race-rooms.js';

export interface GhostRaceFile {
	code: string;
	name: string;
	targetDistance: number;
	createdAt: number;
	expiresAt: number;
	runs: GhostRun[];
}

const DATA_DIR = process.env.DATA_DIR || './data/races';

export function ensureDataDir(): void {
	mkdirSync(DATA_DIR, { recursive: true });
}

export function loadGhostRace(code: string): GhostRaceFile | null {
	try {
		const data = readFileSync(join(DATA_DIR, `${code}.json`), 'utf-8');
		return JSON.parse(data) as GhostRaceFile;
	} catch {
		return null;
	}
}

export function saveGhostRace(code: string, data: GhostRaceFile): void {
	const filePath = join(DATA_DIR, `${code}.json`);
	const tmpPath = filePath + '.tmp';
	writeFileSync(tmpPath, JSON.stringify(data, null, 2));
	renameSync(tmpPath, filePath);
}

export function deleteGhostRace(code: string): void {
	try {
		unlinkSync(join(DATA_DIR, `${code}.json`));
	} catch {
		// File may not exist
	}
}
