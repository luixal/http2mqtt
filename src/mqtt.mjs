import mqtt from "mqtt";
import pino from "pino";

class MqttClient {

  loggerConfig = {
    development: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:mm:ss Z',
          ignore: 'pid,hostname,reqId,responseTime,req,res,message',
          messageFormat: '\u001b[34m[MQTT][{reqId}] {message}\u001b[0m'
        }
      },
    },
    production: true,
    test: false
  };

  constructor(host, port, protocol, clientId, options) {
    this.host = host;
    this.port = port;
    this.protocol = protocol;
    this.clientId = clientId;
    this.options = options;
    // create logger:
    this.logger = pino(this.loggerConfig[process.env.NODE_ENV || 'development']);
    // build connect url:
    this.url = `${protocol}://${host}:${port}`;
  }

  async connect() {
    // this.client = await mqtt.connectAsync(this.url, this.options);
    try {
      this.logger.info({message: 'Connecting to MQTT broker: ' + this.url});
      this.client = await mqtt.connectAsync(this.url, this.options);
      if (this.isConnected()) this.logger.info({message: 'Connected to MQTT broker'});
    } catch(err) {
      this.logger.error({message: 'Error connecting to MQTT broker: ' + err.message});
      throw new Error(err);
    }
  }

  async publish(topic, message, reqId) {
    try {
      await this.client.publishAsync(topic, message);
      this.logger.info({message: 'Message published', reqId});
      return {sucess: true, message: message};
    } catch(err) {
      this.logger.error({message: 'Error publishing message'});
      return {success: false, error: err};
    }
  }

  async disconnect() {
    try {
      await this.client.endAsync();
      this.logger.info({message: 'Disconnected'});
      return true;
    } catch(err) {
      this.logger.error({message: 'Could NOT disconnect'});
      return false;
    }
  }

  isConnected() {
    return this.client?.connected;
  }
}

export default MqttClient;