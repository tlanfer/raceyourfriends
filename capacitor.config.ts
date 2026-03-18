import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.raceyourfriends.app',
	appName: 'Race Your Friends',
	webDir: 'build-static',
	server: {
		// During development, point to your dev server:
		// url: 'http://192.168.1.x:5173',
		// cleartext: true,
	},
	plugins: {
		KeepAwake: {
			// Enabled programmatically during races
		}
	},
	ios: {
		// Background location requires this entitlement
		backgroundColor: '#131210'
	},
	android: {
		backgroundColor: '#131210',
		useLegacyBridge: true // Required by @capgo/background-geolocation
	}
};

export default config;
