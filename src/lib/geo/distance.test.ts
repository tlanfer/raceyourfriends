import { describe, it, expect } from 'vitest';
import { haversine } from './distance.js';

describe('haversine', () => {
	it('returns 0 for same point', () => {
		expect(haversine(51.5, -0.1, 51.5, -0.1)).toBe(0);
	});

	it('computes ~111km for 1 degree latitude', () => {
		const dist = haversine(0, 0, 1, 0);
		expect(dist).toBeGreaterThan(110_000);
		expect(dist).toBeLessThan(112_000);
	});

	it('computes known distance London to Paris (~340km)', () => {
		const dist = haversine(51.5074, -0.1278, 48.8566, 2.3522);
		expect(dist).toBeGreaterThan(330_000);
		expect(dist).toBeLessThan(350_000);
	});

	it('handles antipodal points', () => {
		const dist = haversine(0, 0, 0, 180);
		// Half circumference ≈ 20,015 km
		expect(dist).toBeGreaterThan(20_000_000);
		expect(dist).toBeLessThan(20_100_000);
	});
});
