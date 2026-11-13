# Anargya Live Telemetry

PWA dashboard for vehicle sensor monitoring, built with Next.js App Router.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run build` and `npm start` for a production build.

## Current data source

The dashboard displays clearly labeled simulated readings. It does not connect to a vehicle or ingest a live sensor feed yet. The sensor values and GPS coordinates are example data for the interface; replace them with readings from the vehicle gateway before using this for track operation.

The PWA manifest and service worker cache the app shell after its first online visit. Install it from the browser's install control or browser menu. Offline mode keeps the cached dashboard available, but does not buffer or synchronize sensor data.

## Sensor channels in the dashboard

Cell and brake-disc temperatures, BMS voltage and current, motor and inverter temperature, suspension travel, wheel speed, steering angle, three-axis acceleration, brake pressure, throttle position, and GPS coordinates.

The graphs use explicit units and labeled axes. Their demo timeline contains 13 samples spaced five seconds apart over 60 seconds. The 30-second view uses the final seven samples.

The app icon is a temporary telemetry mark; replace it with the product logo when available.
