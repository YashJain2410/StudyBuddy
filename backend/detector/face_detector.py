# FINAL WORKING CODE
import sys
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import json
import base64
import numpy as np
import cv2
import mediapipe as mp

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_PATH = os.path.join(SCRIPT_DIR, "yolov3-tiny.weights")
CFG_PATH = os.path.join(SCRIPT_DIR, "yolov3-tiny.cfg")
NAMES_PATH = os.path.join(SCRIPT_DIR, "coco.names")

try:
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False, 
        max_num_faces=5, 
        min_detection_confidence=0.5
    )
    net = cv2.dnn.readNet(WEIGHTS_PATH, CFG_PATH)
    with open(NAMES_PATH, "r") as f:
        classes = [line.strip() for line in f.readlines()]
    layer_names = net.getLayerNames()
    try:
        output_layers_indices = net.getUnconnectedOutLayers().flatten()
    except AttributeError:
        output_layers_indices = net.getUnconnectedOutLayers()
    output_layers = [layer_names[i - 1] for i in output_layers_indices]
    models_loaded = True
except Exception as e:
    models_loaded = False
    error_message = f"Failed to load models. Error: {e}"

for line in sys.stdin:
    frame_base64 = line.strip()
    if not frame_base64: continue
    try:
        if not models_loaded:
            raise Exception(error_message)

        img_bytes = base64.b64decode(frame_base64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None: raise Exception("Could not decode frame.")

        faces_count = 0
        phone_detected = False

        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results_mesh = face_mesh.process(image_rgb)
        if results_mesh.multi_face_landmarks:
            faces_count = len(results_mesh.multi_face_landmarks)

        blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
        net.setInput(blob)
        outs = net.forward(output_layers)
        for out in outs:
            for detection in out:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                if confidence > 0.6 and classes[class_id] == 'cell phone':
                    phone_detected = True
                    break
            if phone_detected: break

        focused = (faces_count == 1) and (not phone_detected)
        result = {"focused": focused, "faces_count": faces_count, "phone_detected": phone_detected}
    except Exception as e:
        result = {"error": str(e)}
    sys.stdout.write(json.dumps(result) + "\n")
    sys.stdout.flush()