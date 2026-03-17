import { describe, it, expect } from 'vitest';
import { generateRaceCode, isValidRaceCode } from './race-code.js';

describe('generateRaceCode', () => {
	it('generates a 4-character code', () => {
		const code = generateRaceCode();
		expect(code).toHaveLength(4);
	});

	it('only uses allowed characters', () => {
		for (let i = 0; i < 100; i++) {
			const code = generateRaceCode();
			expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
		}
	});

	it('excludes confusing characters', () => {
		for (let i = 0; i < 100; i++) {
			const code = generateRaceCode();
			expect(code).not.toMatch(/[0O1IL]/);
		}
	});
});

describe('isValidRaceCode', () => {
	it('validates correct codes', () => {
		expect(isValidRaceCode('ABCD')).toBe(true);
		expect(isValidRaceCode('2345')).toBe(true);
	});

	it('rejects invalid codes', () => {
		expect(isValidRaceCode('AB')).toBe(false);
		expect(isValidRaceCode('ABCDE')).toBe(false);
		expect(isValidRaceCode('A0CD')).toBe(false);
		expect(isValidRaceCode('AOCD')).toBe(false);
	});

	it('is case insensitive', () => {
		expect(isValidRaceCode('abcd')).toBe(true);
	});
});
