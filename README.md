# jsauth-socket.io

### Start

```shell
node main.js
```

### Open browser

```shell
http://localhost:3000/
```

### Test with API

```shell
curl http://localhost:3000/device/publish
```

Output

```json
{"message":"published"}
```

### Test with MQTTX

```json
url: wss://broker.emqx.io:8084/mqtt
username: emqx_test
password: emqx_test
topic: device
payload: {"id": "1",  "msg": "hello"}
```