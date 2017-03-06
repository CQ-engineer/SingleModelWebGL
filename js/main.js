/**
 * Created by long on 2016/12/6.
 */
var container,camera, scene, renderer,android, dragRotateControls;

var near,far,cameraPositionZ;
var minfov = 20,maxfov = 90;
var mouseMoveSpeed = 2, touchMoveSpeed = 1.2,rotateSpeed = 1;
var zoomSpeed = 1.0,minZoom = 0.4,maxZoom = 1.4;

var PO = {PERSPECTIVE:1 , ORTHOGRAPHIC:2};
var pORo = PO.ORTHOGRAPHIC;

var geometrys;

function init(xmlUrl,modelpath) {
    $.ajax({
        url: xmlUrl,
        type: 'GET',
        error: function (xml) {
            alert("加载XML文件出错");
        },
        success: function (xml) {
            $(xml).find("data").each(function (i) {
                pORo = $(this).children("pORo").text();
                if(pORo == "perspectiveCamera"){
                    pORo = PO.PERSPECTIVE;
                    minfov = parseFloat($(this).children("minfov").text());
                    maxfov = parseFloat($(this).children("maxfov").text());
                } else{
                    pORo = PO.ORTHOGRAPHIC;
                    zoomSpeed = parseFloat($(this).children("zoomSpeed").text());
                    minZoom = parseFloat($(this).children("minZoom").text());
                    maxZoom = parseFloat($(this).children("maxZoom").text());
                }
                mouseMoveSpeed = parseFloat($(this).children("mouseMoveSpeed").text());
                touchMoveSpeed = parseFloat($(this).children("touchMoveSpeed").text());
                rotateSpeed = parseFloat($(this).children("rotateSpeed").text());
                near = parseFloat($(this).children("near").text());
                far = parseFloat($(this).children("far").text());
                cameraPositionZ = parseFloat($(this).children("cameraPositionZ").text());
                initScene(modelpath);
            });
        }
    });
}

function initScene(modelpath){
    if(pORo == PO.PERSPECTIVE) {
        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, near, far);
    }
    else{
        camera = new THREE.OrthographicCamera(-window.innerWidth*.5,window.innerWidth*.5,window.innerHeight*.5,-window.innerHeight *.5,near,far);
    }
    camera.position.set(0,0,cameraPositionZ);
    scene = new THREE.Scene();
    scene.add( camera );

    var manager = new THREE.LoadingManager();
    manager.onLoad = function () {
        document.getElementById("loaderdiv").style.display="none"
    };
    manager.onStart = function () {
        document.getElementById("loaderdiv").style.display="block"
    };
    var onProgress=function(xhr){
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(percentComplete);

            document.getElementById("bar").style.width = Math.round(percentComplete, 2) + "%";
            document.getElementById("bar").innerHTML = Math.round(percentComplete, 2)+ "%";
            if(Math.round(percentComplete, 2)==100){
                document.getElementById("loaderdiv").style.display="none";
            }
        }
    }

    var dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 200, 200, 1000 ).normalize();
    camera.add( dirLight );
    camera.add( dirLight.target );
    // lights

    var ambientLight = new THREE.AmbientLight( 0xffffff, 0.1 );
    scene.add( ambientLight );

    var pointLight = new THREE.SpotLight( 0xffffff );
    pointLight.position.z = 2500;
    scene.add( pointLight );

    var pointLight2 = new THREE.SpotLight( 0xffffff );
    camera.add( pointLight2 );

    var pointLight3 = new THREE.SpotLight( 0xffffff);
    pointLight3.position.x = - 1000;
    pointLight3.position.z = 1000;
    scene.add( pointLight3 );

    var arrs =  modelpath.split(".");
    if(arrs[1] == "js"){
        var jsonLoader = new THREE.BinaryLoader(manager);
        jsonLoader.load(modelpath, addModelToScene );
    }
    else if(arrs[1] == "obj") {

        // 对路径做进一步解析,得到根路径
        var s = arrs[0].lastIndexOf('/');
        var basePath = arrs[0].substring(0,s+1);
        var modelName = arrs[0].substring(s+1);



        var mtlLoader = new THREE.MTLLoader(manager);
        mtlLoader.setCrossOrigin('');
        mtlLoader.setPath(basePath);
        mtlLoader.load(modelName + '.mtl', function (materials) {


            materials.preload();
            var objLoader = new THREE.OBJLoader(manager);
            objLoader.setMaterials(materials);
            objLoader.setPath(basePath);
            objLoader.load(modelName + '.obj', function (object) {

                scene.add(object);
                android = object;
                geometrys = object.children[0].geometry;
                geometrys.computeBoundingBox();

                onWindowResize();
                addDragRotate();
            }, onProgress);
        });
    }

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x4f4f4f, 1);
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container = document.createElement( 'div' );
    document.body.appendChild( container );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
    animate();

}

function addModelToScene( geometry, materials ) {
    // var material = new THREE.MeshFaceMaterial(materials/*{ color: 'red', wireframe: true } */);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    var material = new THREE.MultiMaterial( materials );

    android = new THREE.Mesh(geometry, material);
    scene.add(android);
    geometrys = geometry;
    onWindowResize();
    addDragRotate();
}

function addDragRotate(){
    dragRotateControls = new THREE.DragRotateControls(camera,android,document);
    dragRotateControls.zoomSpeed  = zoomSpeed;
    dragRotateControls.pORo  = pORo;
    dragRotateControls.minZoom  = minZoom;
    dragRotateControls.maxZoom  = maxZoom;
    dragRotateControls.mouseMoveSpeed  = mouseMoveSpeed;
    dragRotateControls.touchMoveSpeed  = touchMoveSpeed;
    dragRotateControls.minfov  = minfov;
    dragRotateControls.maxfov  = maxfov;
    dragRotateControls.rotateSpeed = rotateSpeed;
}

function onWindowResize() {

    if (pORo == PO.ORTHOGRAPHIC) {
        camera.left = -(geometrys.boundingBox.max.y * window.innerWidth / window.innerHeight)*1.2;
        camera.right = (geometrys.boundingBox.max.y * window.innerWidth / window.innerHeight)*1.2;
        camera.top = geometrys.boundingBox.max.y*1.2;
        camera.bottom = geometrys.boundingBox.min.y*1.2;
    }

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );
    if(dragRotateControls)dragRotateControls.update();
    renderer.render( scene, camera );
}