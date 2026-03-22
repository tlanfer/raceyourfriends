import { Capacitor } from '@capacitor/core';
import { BackgroundGeolocation } from '@capgo/background-geolocation';
import { haversine } from './distance.js';

export interface TrackerState {
	totalDistance: number;
	accuracy: number | null;
	hasSignal: boolean;
	isTracking: boolean;
}

const MAX_ACCURACY = 15; // meters
const MAX_SPEED = 50 * 1000 / 3600; // 50 km/h in m/s
const MIN_DELTA = 3; // meters
const ACCURACY_FACTOR = 0.5;
const SMOOTHING_ALPHA = 0.4;
const SIGNAL_TIMEOUT = 10_000; // ms

export class GeoTracker {
	private lastLat: number | null = null;
	private lastLon: number | null = null;
	private lastTime: number = 0;
	private smoothedLat: number | null = null;
	private smoothedLon: number | null = null;
	private signalTimer: ReturnType<typeof setTimeout> | null = null;
	private webWatchId: number | null = null;

	totalDistance = 0;
	accuracy: number | null = null;
	hasSignal = false;
	isTracking = false;

	private onChange: ((state: TrackerState) => void) | null = null;

	onUpdate(cb: (state: TrackerState) => void): void {
		this.onChange = cb;
	}

	private notify(): void {
		this.onChange?.({
			totalDistance: this.totalDistance,
			accuracy: this.accuracy,
			hasSignal: this.hasSignal,
			isTracking: this.isTracking
		});
	}

	async start(): Promise<void> {
		if (this.isTracking) return;

		this.isTracking = true;
		this.totalDistance = 0;
		this.lastLat = null;
		this.lastLon = null;
		this.smoothedLat = null;
		this.smoothedLon = null;
		this.notify();

		if (Capacitor.isNativePlatform()) {
			await BackgroundGeolocation.start(
				{
					backgroundTitle: 'Race Your Friends',
					backgroundMessage: 'Tracking your distance...',
					requestPermissions: false,
					stale: false,
					distanceFilter: 0
				},
				(location, error) => {
					if (error) {
						this.handleError();
						return;
					}
					if (location) {
						this.handlePosition({
							latitude: location.latitude,
							longitude: location.longitude,
							accuracy: location.accuracy
						});
					}
				}
			);
		} else {
			if (!('geolocation' in navigator)) return;
			this.webWatchId = navigator.geolocation.watchPosition(
				(pos) => this.handlePosition(pos.coords),
				() => this.handleError(),
				{ enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
			);
		}
	}

	async stop(): Promise<void> {
		if (Capacitor.isNativePlatform()) {
			await BackgroundGeolocation.stop().catch(() => {});
		} else if (this.webWatchId !== null) {
			navigator.geolocation.clearWatch(this.webWatchId);
			this.webWatchId = null;
		}
		if (this.signalTimer) {
			clearTimeout(this.signalTimer);
			this.signalTimer = null;
		}
		this.isTracking = false;
		this.notify();
	}

	private handlePosition(coords: { latitude: number; longitude: number; accuracy: number }): void {
		this.resetSignalTimer();
		this.hasSignal = true;
		this.accuracy = coords.accuracy;

		const { latitude, longitude } = coords;

		// Jitter filter: accuracy
		if (coords.accuracy > MAX_ACCURACY) {
			this.notify();
			return;
		}

		// EMA smoothing
		if (this.smoothedLat === null || this.smoothedLon === null) {
			this.smoothedLat = latitude;
			this.smoothedLon = longitude;
		} else {
			this.smoothedLat = SMOOTHING_ALPHA * latitude + (1 - SMOOTHING_ALPHA) * this.smoothedLat;
			this.smoothedLon = SMOOTHING_ALPHA * longitude + (1 - SMOOTHING_ALPHA) * this.smoothedLon;
		}

		if (this.lastLat !== null && this.lastLon !== null) {
			const dist = haversine(this.lastLat, this.lastLon, this.smoothedLat, this.smoothedLon);

			// Jitter filter: accuracy-proportional minimum delta
			const effectiveMinDelta = Math.max(MIN_DELTA, coords.accuracy * ACCURACY_FACTOR);
			if (dist < effectiveMinDelta) {
				this.notify();
				return;
			}

			// Jitter filter: max speed
			const now = Date.now();
			const dt = (now - this.lastTime) / 1000;
			if (dt > 0 && dist / dt > MAX_SPEED) {
				this.notify();
				return;
			}

			this.totalDistance += dist;
		}

		this.lastLat = this.smoothedLat;
		this.lastLon = this.smoothedLon;
		this.lastTime = Date.now();
		this.notify();
	}

	private handleError(): void {
		this.hasSignal = false;
		this.notify();
	}

	private resetSignalTimer(): void {
		if (this.signalTimer) clearTimeout(this.signalTimer);
		this.signalTimer = setTimeout(() => {
			this.hasSignal = false;
			this.notify();
		}, SIGNAL_TIMEOUT);
	}
}
