/**
 * Created by long on 2016/12/9.
 */
THREE.DragRotateControls = function( _camera, _objects, _document ) {

    var drc = this;
    this.STATE = {NONEOFF: -2, NONE: -1, TOUCH_ROTATE: 0, TOUCH_MOVE: 1, TOUCH_ZOOM: 2, TOUCH_DOWN: 3};
    this.state = this.STATE.NONE;

    this.mouseButtons = {LEFT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT};
    this.mouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.modelScreenPoint;
    this.mouseStart;

    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();

    this.moveStart = new THREE.Vector2();
    this.moveEnd = new THREE.Vector2();
    this.moveDelta = new THREE.Vector2();

    this.zoomStart = [new THREE.Vector2(), new THREE.Vector2()];
    this.zoomEnd = [new THREE.Vector2(), new THREE.Vector2()];
    this.zoomV = [new THREE.Vector2(), new THREE.Vector2()];

    this.minfov = 20;
    this.maxfov = 90;
    this.mouseMoveSpeed = 2;
    this.touchMoveSpeed = 1.2;
    this.rotateSpeed = 1;
    this.zoomSpeed = 1.0;
    this.minZoom = 0.4;
    this.maxZoom = 1.4;
    this.pORo;

    this.rotateStartPoint = new THREE.Vector2();
    this.rotateEndPoint = new THREE.Vector2();

    var mouse = { x: 1, y: 1 };

    this.onMouseDownPitch = 0;//��갴�¸�����ĸ�����
    this.onMouseDownYaw = 0;//��갴�������ƫ����

    this.addMouseEvent = function () {
        _document.addEventListener('contextmenu', onContextMenu, false);//ȥ���Ҽ���������˵�

        _document.addEventListener("mousedown", onDocumentMouseDown, false);
        _document.addEventListener('mousemove', onDocumentMouseMove, false);
        _document.addEventListener('mouseup', onDocumentMouseUp, false);
        _document.addEventListener('mousewheel', onDocumentMouseWheel, false);

        _document.addEventListener('touchstart', onDocumentTouchStart, false);
        _document.addEventListener('touchmove', onDocumentTouchMove, false);
        _document.addEventListener('touchend', onDocumentTouchEnd, false);
    }(),

        this.update = function () {
            if (this.state == this.STATE.TOUCH_MOVE) {
                var curScreenPoint = _camera.localToWorld(new THREE.Vector3(this.zoomEnd[0].x, this.zoomEnd[0].y, this.modelScreenPoint.z));
                var offset1 = new THREE.Vector3().subVectors(this.mouseStart, curScreenPoint);
                if (Math.abs(offset1.x) <= 2)return;
                if (Math.abs(offset1.y) <= 2)return;
                _objects.position.x -= offset1.x * this.touchMoveSpeed;
                _objects.position.y += offset1.y * this.touchMoveSpeed;
                _objects.position.z += offset1.z;
                this.mouseStart = _camera.localToWorld(new THREE.Vector3(this.zoomEnd[0].x, this.zoomEnd[0].y, this.modelScreenPoint.z));

                this.zoomStart[0].copy(this.zoomEnd[0]);
                this.zoomStart[1].copy(this.zoomEnd[1]);
                this.state = this.STATE.TOUCH_DOWN;
            }
            else if (this.state == this.STATE.TOUCH_ZOOM) {
                var num = this.moveEnd.y - this.moveStart.y;
                if (this.pORo == PO.PERSPECTIVE) {
                    var fov = Math.max(this.minfov, Math.min(this.maxfov, _camera.fov - num * 0.05));
                    _camera.fov = fov;
                } else {
                    if (num > 0) {
                        _camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, _camera.zoom / getZoomScale()));
                    }
                    else {
                        _camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, _camera.zoom * getZoomScale()));
                    }
                }
                this.moveStart.copy(this.moveEnd);
                _camera.updateProjectionMatrix();
                this.state = this.STATE.TOUCH_DOWN;
            }
        }

    function onContextMenu(evt) {
        evt.preventDefault();
    }

//��갴��
    function onDocumentMouseDown(evt) {
        evt.preventDefault();

        drc.mouseDown = true;
        if (evt.button == drc.mouseButtons.LEFT) {
            drc.state = drc.STATE.TOUCH_ROTATE;
            drc.rotateStartPoint = projectOnTrackball(evt.clientX , evt.clientY);
        }
        else if (evt.button == drc.mouseButtons.RIGHT) {
            drc.state = drc.STATE.TOUCH_DOWN;
            drc.modelScreenPoint = _camera.worldToLocal(new THREE.Vector3(_objects.position.x, _objects.position.y, _objects.position.z));
            drc.mouseStart = _camera.localToWorld(new THREE.Vector3(evt.clientX, evt.clientY, drc.modelScreenPoint.z));
        }
    }

//����ƶ�
    function onDocumentMouseMove(evt) {
        evt.preventDefault();
        if (!drc.mouseDown)  return;
        if (drc.state == drc.STATE.TOUCH_ROTATE) {
            rotateScene(evt.clientX, evt.clientY);
        }
        else if (drc.state == drc.STATE.TOUCH_DOWN) {
            drc.moveDelta.set(evt.clientX, evt.clientY);
            var curScreenPoint = _camera.localToWorld(new THREE.Vector3(evt.clientX, evt.clientY, drc.modelScreenPoint.z));
            var offset1 = new THREE.Vector3().subVectors(drc.mouseStart, curScreenPoint);
            _objects.position.x -= offset1.x * drc.mouseMoveSpeed;
            _objects.position.y += offset1.y * drc.mouseMoveSpeed;
            _objects.position.z += offset1.z;
            drc.mouseStart = _camera.localToWorld(new THREE.Vector3(evt.clientX, evt.clientY, drc.modelScreenPoint.z));
        }
    }

//��굯��
    function onDocumentMouseUp(evt) {
        evt.preventDefault();
        drc.mouseDown = false;
        drc.state = drc.STATE.NONE;
    }

//����м�����
    function onDocumentMouseWheel(evt) {
        evt.preventDefault();
        if (drc.pORo == PO.PERSPECTIVE) {
            var fov = Math.max(drc.minfov, Math.min(drc.maxfov, _camera.fov - evt.wheelDelta * 0.04));
            _camera.fov = fov;
        } else {
            if (evt.wheelDelta > 0) {
                _camera.zoom = Math.max(drc.minZoom, Math.min(drc.maxZoom, _camera.zoom / getZoomScale()));
            }
            else {
                _camera.zoom = Math.max(drc.minZoom, Math.min(drc.maxZoom, _camera.zoom * getZoomScale()));
            }
        }
        _camera.updateProjectionMatrix();
    }

    function getZoomScale() {
        if (drc.mouseDown) {
            return Math.pow(0.95, drc.zoomSpeed);
        }
        else {
            return Math.pow(0.98, drc.zoomSpeed);
        }
    }

//��������
    function onDocumentTouchStart(evt) {
        evt.preventDefault();
        switch (evt.touches.length) {
            case 1:
                drc.state = drc.STATE.TOUCH_ROTATE;
                drc.rotateStartPoint = projectOnTrackball(evt.touches[0].pageX, evt.touches[0].pageY);
                break;
            case 2:
                drc.state = drc.STATE.TOUCH_DOWN;
                if (drc.state == drc.STATE.NONEOFF)return;
                drc.zoomStart[0].set(evt.touches[0].pageX, evt.touches[0].pageY);
                drc.zoomStart[1].set(evt.touches[1].pageX, evt.touches[1].pageY);

                var dx = evt.touches[0].pageX - evt.touches[1].pageX;
                var dy = evt.touches[0].pageY - evt.touches[1].pageY;
                var distance = Math.sqrt(dx * dx + dy * dy);
                drc.moveStart.set(0, distance);

                drc.modelScreenPoint = _camera.worldToLocal(new THREE.Vector3(_objects.position.x, _objects.position.y, _objects.position.z));
                drc.mouseStart = _camera.localToWorld(new THREE.Vector3(drc.zoomStart[0].x, drc.zoomStart[0].y, drc.modelScreenPoint.z));
                break;
        }
    }

//�����ƶ�
    function onDocumentTouchMove(evt) {
        switch (evt.touches.length) {
            case 1:
                if (drc.state == drc.STATE.NONE || drc.state == drc.STATE.TOUCH_ROTATE) {
                    rotateScene(evt.touches[0].pageX, evt.touches[0].pageY)
                }
                break;
            case 2:
                if (drc.state = drc.STATE.TOUCH_DOWN) {
                    drc.zoomEnd[0].set(evt.touches[0].pageX, evt.touches[0].pageY);
                    drc.zoomEnd[1].set(evt.touches[1].pageX, evt.touches[1].pageY);
                    drc.zoomV[0].subVectors(drc.zoomEnd[0], drc.zoomStart[0]);
                    drc.zoomV[1].subVectors(drc.zoomEnd[1], drc.zoomStart[1]);

                    var dx = evt.touches[0].pageX - evt.touches[1].pageX;
                    var dy = evt.touches[0].pageY - evt.touches[1].pageY;
                    var distance = Math.sqrt(dx * dx + dy * dy);

                    var x_y = drc.zoomV[0].x * drc.zoomV[1].x + drc.zoomV[0].y * drc.zoomV[1].y;

                    if (x_y >= 0 && (drc.zoomV[0].x * drc.zoomV[1].x != 0 || drc.zoomV[0].y * drc.zoomV[1].y != 0)) {//�ƶ�
                        drc.state = drc.STATE.TOUCH_MOVE;
                    }
                    else if (Math.abs(distance - drc.moveStart.y) >= 10) {//����
                        drc.state = drc.STATE.TOUCH_ZOOM;
                        drc.moveEnd.set(0, distance);
                    }
                }
                break;
        }
    }

//��������
    function onDocumentTouchEnd(evt) {
        if (evt.touches.length < 0) {
            drc.state = drc.STATE.NONE;
        }
        else {
            drc.state = drc.STATE.NONEOFF;
        }
    }

    function rotateScene(deltaX, deltaY) {
        handleRotation(_objects,deltaX, deltaY);
    }

    function rotateMatrix(rotateStart, rotateEnd){
        var axis = new THREE.Vector3();
        var quaternion = new THREE.Quaternion();
        //�õ���ʼ�ͽ���������ļн�
        var angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());

        if (angle){  //����нǵ���0�� ˵������û����ת
            axis.crossVectors(rotateStart, rotateEnd).normalize();  //rotateStart,rotateEnd�����˻� ��׼�� �õ���ת��
            angle *= drc.rotateSpeed; //rotationSpeed��תϵ�� �õ���ת����
            quaternion.setFromAxisAngle(axis, angle);  //��һ����ת�����ת���ȵõ���Ԫ�飬 ���Ҫ�������෴������ת ����angleΪ��
        }
        return quaternion; //����һ����ת����Ԫ��
    }

    function handleRotation (object,deltaX, deltaY){
        drc.rotateEndPoint = projectOnTrackball(deltaX,deltaY);
        var rotateQuaternion = rotateMatrix(drc.rotateStartPoint, drc.rotateEndPoint);
        var curQuaternion = object.quaternion;
        curQuaternion.multiplyQuaternions(rotateQuaternion, curQuaternion); //������Ԫ�� a x b
        curQuaternion.normalize();
        object.setRotationFromQuaternion(curQuaternion);  //����ͨ���淶������ת��Ԫ��ֱ��Ӧ����ת  ��������normalize()

        drc.rotateStartPoint.copy(drc.rotateEndPoint);
    }

    function projectOnTrackball(dx,dy){
        mouse.x = ( dx / window.innerWidth ) * 2 - 1;
        mouse.y = -( dy / window.innerHeight ) * 2 + 1;

        var vector = new THREE.Vector3( -mouse.x, -mouse.y, 0.5 );
        vector.unproject(camera);

        var v3 = new THREE.Vector3().sub(_objects.position,vector);
        return v3;
    }
}