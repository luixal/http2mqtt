# http2mqtt
A simple app to send HTTP queries to an MQTT broker

## Description
This app listens for http queries (GET and POST) and send the data received to an mqtt broker.

## Running
You can run this app in two different ways, just running the code and running the docker image.

### Just the code
To run the app without docker follow these steps:

1. Download the code from the [releases page](https://github.com/luixal/http2mqtt/releases) or just clone the repo:

```sh
git clone https://github.com/luixal/http2mqtt.git
```

2. Create an `.env` with the options you need from the Configuration section below, in example:

```env
# http
HTTP_API_KEY=my-long-api-key
# mqtt
MQTT_HOST=my.mqtt.broker
MQTT_PORT=1883
MQTT_PROTOCOL=mqtt
MQTT_CLIENT_ID=my_mqtt_client_id
MQTT_USERNAME=my_username
MQTT_PASSWORD=my_password
MQTT_TOPIC=my_topic
MQTT_CONNECT_TIMEOUT=4000
MQTT_RECONNECT_PERIOD=1000
```

3. Install dependencies using npm:

```
npm i
```

4. Run it:

```
npm run main
```

### Using Docker
To run the app using docker with these command (set the env values you need from the Configuration section):

```
docker run --name luixal/http2mqtt --env MQTT_HOST=my.mqtt.broker --env MQTT_TOPIC=my_topic -d luixal/http2mqtt:latest
```

Or you can just use docker compose with a docker-compose.yml file like this one:

```yaml
version: "3.3"
services:
  http2mqtt:
    image: luixal/http2mqtt:latest
    container_name: http2mqtt
    ports:
      - "3000:3000"
    environment:
      HTTP_API_KEY: my-long-api-key
      MQTT_HOST: my.mqtt.broker
      MQTT_PORT: 1883
      MQTT_PROTOCOL: mqtt
      MQTT_CLIENT_ID: my_mqtt_client_id 
      MQTT_USERNAME: my_username
      MQTT_PASSWORD: my_password
      MQTT_TOPIC: my_topic
      MQTT_CONNECT_TIMEOUT: 4000
      MQTT_RECONNECT_PERIOD: 1000
```

and run it as usual:

```sh
docker compose up
```

## Configuration
This app uses environment variables for configuration. Minimum variables are `MQTT_HOST` and `MQTT_TOPIC`.

The available variables are:

| Variable | Description | Default | Mandatory |
| -------- | ----------- | ------- | --------- |
| HTTP_API_KEY | An api-key for a minimum security | '' | NO |
| HTTP_GET_PATH | Path in url for GET queries | '/' | NO |
| HTTP_POST_PATH | Path in url for POST queries | '/' | NO |
| HTTP_DISABLE_GET | Wheter to disable GET queries or not | 'false' | NO |
| HTTP_DISABLE_POST | Wheter to disable POST queries or not | 'false' | NO |
| MQTT_HOST | Address/IP for the mqtt broker | '' | **YES** |
| MQTT_PORT | Port to use for the mqtt broker | 1883 | NO |
| MQTT_PROTOCOL | Protocol to connect the mqtt broker | 'MQTT' | NO |
| MQTT_CLIENT_ID | Client ID to use in the mqtt connection | 'mqttjs_' + Math.random().toString(16).substr(2, 8) | NO |
| MQTT_USERNAME | Username for the mqtt connection | '' | NO |
| MQTT_PASSWORD | Password for the mqtt connection | '' | NO |
| MQTT_TOPIC | Topic to publish the messages | '' | **YES** |
| MQTT_CONNECT_TIMEOUT | Mqtt connection timeout | 30000 | NO |
| MQTT_RECONNECT_PERIOD | Mqtt reconnect time | 1000 | NO |

NOTE: this app uses [MQTT.js](https://github.com/mqttjs) so the default values for its options are the same. You can check them [here](https://github.com/mqttjs/MQTT.js?tab=readme-ov-file#mqttclientstreambuilder-options).

## API-KEY
The api-key is used for a minimum security. It only applies to the the POST query.

If you set it, for example, like this:

```env
HTTP_API_KEY=aaa
```
 and send a POST query to this url:

```http
http://your.server:3000/
```

and the api-key must be provided in the `X-API-KEY` header for the query to be accepted.

## Example
Let's say you use the following configuration:

```env
# http
HTTP_API_KEY=xxx
# mqtt
MQTT_HOST=my.mqtt.broker
MQTT_TOPIC=my_topic
```

You will have this endpoints published:

```
GET: http://my.server:3000/xxx
POST: http://my.server:3000/
```

If you hit the GET endpoint with this query:

```sh
curl "http://my.server:3000/xxx?valueA=a&valueB=2"
```

You will get this mqtt messages published in the topic `my_topic`:

```json
{ "valueA": "a", "valueB": 2 }
```

If you hit the POST endpoint with this query:

```sh
curl -d '{"key1": "value1", "key2": "value2", "value3": 3}' -H "Content-Type: application/json" -H "X-API-KEY: xxx" -X POST "http://my.server:3000/"
```

You will get this mqtt messages published in the topic `my_topic`:

```json
{"key1": "value1", "key2": "value2", "value3": 3}
```

If you don't include the `X-API-KEY`, the query will be reject as `unauthorized`.