import Fastify from "fastify";
import MqttClient from "./mqtt.mjs";

const NODE_ENV = process.env.NODE_ENV || 'development';
const HTTP_API_KEY = process.env.HTTP_API_KEY;
// mqtt env variables:
const MQTT_HOST = process.env.MQTT_HOST;
const MQTT_PORT = process.env.MQTT_PORT;
const MQTT_PROTOCOL = process.env.MQTT_PROTOCOL;
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_TOPIC = process.env.MQTT_TOPIC;
const MQTT_CONNECT_TIMEOUT = process.env.MQTT_CONNECT_TIMEOUT;
const MQTT_RECONNECT_PERIOD = process.env.MQTT_RECONNECT_PERIOD;

console.log(`http2mqtt v.${process.env.npm_package_version}\n`);
// check for minimum variables:
if (!MQTT_HOST || !MQTT_TOPIC) {
  console.log(`You must provide minimum config values:${!MQTT_HOST ? '\n\t- MQTT_HOST is missing' : ''}${!MQTT_TOPIC ? '\n\t- MQTT_TOPIC is missing' : ''}`);
  process.exit(1);
}

// fastify logger:
const loggerFastify = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:mm:ss Z',
        ignore: 'pid,hostname,reqId,responseTime,req,res',
        messageFormat: '[HTTP][{reqId}] {msg} [{reqId}][{req.method}][{req.url}] [{req.remoteAddress}:{req.remotePort}] [{res.statusCode}][{responseTime}]'
      }
    },
  },
  production: true,
  test: false
};

// create fastify api:
const fastify = Fastify({
  logger: loggerFastify[NODE_ENV] ?? true
});

// create mqtt client:
const mqttClient = new MqttClient(
  MQTT_HOST,
  MQTT_PORT,
  MQTT_PROTOCOL,
  MQTT_CLIENT_ID,
  {
    clientId: MQTT_CLIENT_ID,
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    reconnectPeriod: MQTT_RECONNECT_PERIOD,
    connectTimeout: MQTT_CONNECT_TIMEOUT

  }
);

// warning if no API-KEY is provided:
if (!HTTP_API_KEY) fastify.log.warn('No API-KEY defined. You\'re going wild!');

// API-KEY validation hook:
fastify.addHook(
  'onRequest',
  (req, res, done) => {
    if (req.params.apiKey === HTTP_API_KEY || req.headers['x-api-key'] === HTTP_API_KEY) {
      done();
    } else {
      fastify.log.warn('Invalid API-KEY in request');
      res.code(401).send({msg: 'Unauthorized - Invalid API-KEY'});
    }
  }
);

// GET route:
fastify.get(
  '/:apiKey',
  async function handler(req, res) {
    return await mqttClient.publish(MQTT_TOPIC, JSON.stringify(req.query), req.id);
  }
);

// POST route:
fastify.post(
  '/',
  async function handler(req, res) {
    return await mqttClient.publish(MQTT_TOPIC, JSON.stringify(req.body), req.id);
  }
)


// main code:
try {
  // connect to mqtt broker:
  await mqttClient.connect();
  await fastify.listen({
    port: 3000,
    host: '0.0.0.0'
  });
} catch(err) {
  fastify.log.error(err);
  await mqttClient.disconnect();
  process.exit(1);
}