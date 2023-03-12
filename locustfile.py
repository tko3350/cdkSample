from locust import HttpUser, task,User
import paho.mqtt.client as mqtt
import time
import json
import ssl
#from locust.events import request_success, request_failure
#from locust import request_success, request_failure

IOT_ENDPOINT = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
CA_FILE_PATH = "AmazonRootCA1.pem"
QoS = 1

def get_client():
 
    client = mqtt.Client(protocol=mqtt.MQTTv311)
 
    client.tls_set(CA_FILE_PATH,
                   certfile='certificate.pem.crt',
                   keyfile='private.pem.key',
                   tls_version=ssl.PROTOCOL_TLSv1_2)
    client.tls_insecure_set(True)
 
    return client

class HelloWorldUser(HttpUser):
    def on_start(self):
      self.client = get_client()
      self.topic = "device01/test"
      self.client.connect(IOT_ENDPOINT, 8883, keepalive=60)
      self.client.loop_start()

    @task
    def pub01(self):
      time.sleep(1)
      # 生データに加えて負荷テストでの集計用にtimestampを付与
      payload = json.dumps({
        "timestamp": time.time(),
        "topic": self.topic,
        "payload": {
          "hoge":"hogehoge"
        }
      })
      start_time = time.time()
      err, mid = self.client.publish(self.topic, payload, qos=QoS)
'''
      if err:
        request_failure.fire(
          request_type='publish',
          name=self.topic,
          response_time=(time.time() - start_time) * 1000,
          exception=err,
        )
        return
 
      request_success.fire(
        request_type='publish',
        name=self.topic,
        response_time=(time.time() - start_time) * 1000,
        response_length=len(payload),
      )
'''
class MyLocust(User):
    task_set = HelloWorldUser
    #min_wait = 5000
    #max_wait = 15000
