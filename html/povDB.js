<<<<<<< HEAD
let lastPosition = { x: 0, y: 0, z: 0 };
let lastDirection = { x: 0, y: 0, z: 0 };
let lastUpVector = { x: 0, y: 0, z: 0 };
let lastSavedPosition = null;
let stableStartTime = null;
const STABLE_THRESHOLD = 0.12;
const CHECK_INTERVAL = 520;

let povVector = new THREE.Vector3();

function isStable(newVal, lastVal, threshold) {
    return (
        Math.abs(newVal.x - lastVal.x) < threshold &&
        Math.abs(newVal.y - lastVal.y) < threshold &&
        Math.abs(newVal.z - lastVal.z) < threshold
    );
}

function isSameAsLastSaved(current, lastSaved) {
    if (!lastSaved) return false;
    return (
        Math.abs(current.pov_x - lastSaved.pov_x) < STABLE_THRESHOLD &&
        Math.abs(current.pov_y - lastSaved.pov_y) < STABLE_THRESHOLD &&
        Math.abs(current.pov_z - lastSaved.pov_z) < STABLE_THRESHOLD &&
        Math.abs(current.dir_x - lastSaved.dir_x) < STABLE_THRESHOLD &&
        Math.abs(current.dir_y - lastSaved.dir_y) < STABLE_THRESHOLD &&
        Math.abs(current.dir_z - lastSaved.dir_z) < STABLE_THRESHOLD &&
        Math.abs(current.up_x - lastSaved.up_x) < STABLE_THRESHOLD &&
        Math.abs(current.up_y - lastSaved.up_y) < STABLE_THRESHOLD &&
        Math.abs(current.up_z - lastSaved.up_z) < STABLE_THRESHOLD
    );
}


function sendPOVData() {
    const sessionId = sessionStorage.getItem("sessionId");

    if (isBlurred || Deactivate || !sessionId || !currentMeshName) {
        return;
    }

    const currentQuestion = questions_ing[currentQuestionIndex];

    const modeMapping = {
        0: 'multi_model',
        1: 'single_model',
        2: 'photo_model'
    };

    const povPosition = camera.position.clone();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);

    const upVector = camera.up.clone();

    const currentFOV = camera.fov;

    const data = {
        id: sessionId,
        mesh_name: currentMeshName,
        question_text: currentQuestion.text,
        question_type: modeMapping[currentQuestion.mode],
        pov_x: parseFloat(povPosition.x),
        pov_y: parseFloat(povPosition.y),
        pov_z: parseFloat(povPosition.z),
        dir_x: parseFloat(viewDirection.x),
        dir_y: parseFloat(viewDirection.y),
        dir_z: parseFloat(viewDirection.z),
        up_x: parseFloat(upVector.x),
        up_y: parseFloat(upVector.y),
        up_z: parseFloat(upVector.z),
        fov: parseFloat(currentFOV)
    };

    if (isSameAsLastSaved(data, lastSavedPosition)) {
        console.log("POV non inviato: dati già presenti.");
        return;
    }

    fetch("http://127.0.0.1:5000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log("POV inviato al server:", result);
        lastSavedPosition = data;
    })
    .catch(error => console.error("Errore nell'invio del POV:", error));
}

function sendCurrentPOVToServer() {
    const sessionId = sessionStorage.getItem("sessionId");

    if (!sessionId || !currentMeshName) {
        console.warn("Impossibile inviare POV: sessionId o currentMeshName mancante.");
        return;
    }

    const povPosition = camera.position.clone();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);

    const upVector = camera.up.clone();

    const currentFOV = camera.fov;

    const data = {
        id: sessionId,
        mesh_name: currentMeshName,
        pov_x: parseFloat(povPosition.x),
        pov_y: parseFloat(povPosition.y),
        pov_z: parseFloat(povPosition.z),
        dir_x: parseFloat(viewDirection.x),
        dir_y: parseFloat(viewDirection.y),
        dir_z: parseFloat(viewDirection.z),
        up_x: parseFloat(upVector.x),
        up_y: parseFloat(upVector.y),
        up_z: parseFloat(upVector.z),
        fov: parseFloat(currentFOV)
    };

    if (isSameAsLastSaved(data, lastSavedPosition)) {
        console.log("POV non inviato: dati già presenti.");
        return;
    }

    fetch("http://127.0.0.1:5000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log("POV inviato al server:", result);
        lastSavedPosition = data;
    })
    .catch(error => console.error("Errore nell'invio del POV:", error));
}


function sendPOVDataPhoto(questionData) {
    const sessionId = sessionStorage.getItem("sessionId");

    if (isBlurred || !sessionId || !currentMeshName || !questionData) {
        return;
    }

    const modeMapping = {
        0: 'multi_model',
        1: 'single_model',
        2: 'photo_model'
    };

    const povPosition = camera.position.clone();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);
    const upVector = camera.up.clone();
    const currentFOV = camera.fov;

    const data = {
        id: sessionId,
        mesh_name: currentMeshName,
        question_text: questionData.text,
        question_type: modeMapping[questionData.mode],
        pov_x: parseFloat(povPosition.x),
        pov_y: parseFloat(povPosition.y),
        pov_z: parseFloat(povPosition.z),
        dir_x: parseFloat(viewDirection.x),
        dir_y: parseFloat(viewDirection.y),
        dir_z: parseFloat(viewDirection.z),
        up_x: parseFloat(upVector.x),
        up_y: parseFloat(upVector.y),
        up_z: parseFloat(upVector.z),
        fov: parseFloat(currentFOV)
    };

    if (isSameAsLastSaved(data, lastSavedPosition)) {
        console.log("POV non inviato: dati già presenti.");
        return;
    }

    fetch("http://127.0.0.1:5000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log("POV inviato al server:", result);
        lastSavedPosition = data;
    })
    .catch(error => console.error("Errore nell'invio del POV:", error));
}



function monitorPOV() {
    setInterval(() => {
        
        povVector = camera.getWorldDirection(new THREE.Vector3());
        const currentPosition = { 
            x: camera.position.x, 
            y: camera.position.y, 
            z: camera.position.z 
        };
        const currentDirection = { 
            x: povVector.x, 
            y: povVector.y, 
            z: povVector.z 
        };
        const currentUpVector = { 
            x: camera.up.x, 
            y: camera.up.y, 
            z: camera.up.z 
        };

        if (
            isStable(currentPosition, lastPosition, STABLE_THRESHOLD) &&
            isStable(currentDirection, lastDirection, STABLE_THRESHOLD) &&
            isStable(currentUpVector, lastUpVector, STABLE_THRESHOLD)
        ) {
            sendPOVData();  
            }
        

        lastPosition = currentPosition;
        lastDirection = currentDirection;
        lastUpVector = currentUpVector;
    }, CHECK_INTERVAL);
}





document.addEventListener("DOMContentLoaded", monitorPOV);
=======
let lastPosition = { x: 0, y: 0, z: 0 };
let lastDirection = { x: 0, y: 0, z: 0 };
let lastUpVector = { x: 0, y: 0, z: 0 };
let lastSavedPosition = null;
let stableStartTime = null;
const STABLE_THRESHOLD = 0.12;
const CHECK_INTERVAL = 520;

let povVector = new THREE.Vector3();

function isStable(newVal, lastVal, threshold) {
    return (
        Math.abs(newVal.x - lastVal.x) < threshold &&
        Math.abs(newVal.y - lastVal.y) < threshold &&
        Math.abs(newVal.z - lastVal.z) < threshold
    );
}

function isSameAsLastSaved(current, lastSaved) {
    if (!lastSaved) return false;
    return (
        Math.abs(current.pov_x - lastSaved.pov_x) < STABLE_THRESHOLD &&
        Math.abs(current.pov_y - lastSaved.pov_y) < STABLE_THRESHOLD &&
        Math.abs(current.pov_z - lastSaved.pov_z) < STABLE_THRESHOLD &&
        Math.abs(current.dir_x - lastSaved.dir_x) < STABLE_THRESHOLD &&
        Math.abs(current.dir_y - lastSaved.dir_y) < STABLE_THRESHOLD &&
        Math.abs(current.dir_z - lastSaved.dir_z) < STABLE_THRESHOLD &&
        Math.abs(current.up_x - lastSaved.up_x) < STABLE_THRESHOLD &&
        Math.abs(current.up_y - lastSaved.up_y) < STABLE_THRESHOLD &&
        Math.abs(current.up_z - lastSaved.up_z) < STABLE_THRESHOLD
    );
}


function sendPOVData() {
    const sessionId = sessionStorage.getItem("sessionId");

    if (isBlurred || Deactivate || !sessionId || !currentMeshName) {
        return;
    }

    const currentQuestion = questions_ing[currentQuestionIndex];

    const modeMapping = {
        0: 'multi_model',
        1: 'single_model',
        2: 'photo_model'
    };

    const povPosition = camera.position.clone();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);

    const upVector = camera.up.clone();

    const currentFOV = camera.fov;

    const data = {
        id: sessionId,
        mesh_name: currentMeshName,
        question_text: currentQuestion.text,
        question_type: modeMapping[currentQuestion.mode],
        pov_x: parseFloat(povPosition.x),
        pov_y: parseFloat(povPosition.y),
        pov_z: parseFloat(povPosition.z),
        dir_x: parseFloat(viewDirection.x),
        dir_y: parseFloat(viewDirection.y),
        dir_z: parseFloat(viewDirection.z),
        up_x: parseFloat(upVector.x),
        up_y: parseFloat(upVector.y),
        up_z: parseFloat(upVector.z),
        fov: parseFloat(currentFOV)
    };

    if (isSameAsLastSaved(data, lastSavedPosition)) {
        console.log("POV non inviato: dati già presenti.");
        return;
    }

    fetch("http://127.0.0.1:5000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log("POV inviato al server:", result);
        lastSavedPosition = data;
    })
    .catch(error => console.error("Errore nell'invio del POV:", error));
}

function sendCurrentPOVToServer() {
    const sessionId = sessionStorage.getItem("sessionId");

    if (!sessionId || !currentMeshName) {
        console.warn("Impossibile inviare POV: sessionId o currentMeshName mancante.");
        return;
    }

    const povPosition = camera.position.clone();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);

    const upVector = camera.up.clone();

    const currentFOV = camera.fov;

    const data = {
        id: sessionId,
        mesh_name: currentMeshName,
        pov_x: parseFloat(povPosition.x),
        pov_y: parseFloat(povPosition.y),
        pov_z: parseFloat(povPosition.z),
        dir_x: parseFloat(viewDirection.x),
        dir_y: parseFloat(viewDirection.y),
        dir_z: parseFloat(viewDirection.z),
        up_x: parseFloat(upVector.x),
        up_y: parseFloat(upVector.y),
        up_z: parseFloat(upVector.z),
        fov: parseFloat(currentFOV)
    };

    if (isSameAsLastSaved(data, lastSavedPosition)) {
        console.log("POV non inviato: dati già presenti.");
        return;
    }

    fetch("http://127.0.0.1:5000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log("POV inviato al server:", result);
        lastSavedPosition = data;
    })
    .catch(error => console.error("Errore nell'invio del POV:", error));
}


function sendPOVDataPhoto(questionData) {
    const sessionId = sessionStorage.getItem("sessionId");

    if (isBlurred || !sessionId || !currentMeshName || !questionData) {
        return;
    }

    const modeMapping = {
        0: 'multi_model',
        1: 'single_model',
        2: 'photo_model'
    };

    const povPosition = camera.position.clone();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);
    const upVector = camera.up.clone();
    const currentFOV = camera.fov;

    const data = {
        id: sessionId,
        mesh_name: currentMeshName,
        question_text: questionData.text,
        question_type: modeMapping[questionData.mode],
        pov_x: parseFloat(povPosition.x),
        pov_y: parseFloat(povPosition.y),
        pov_z: parseFloat(povPosition.z),
        dir_x: parseFloat(viewDirection.x),
        dir_y: parseFloat(viewDirection.y),
        dir_z: parseFloat(viewDirection.z),
        up_x: parseFloat(upVector.x),
        up_y: parseFloat(upVector.y),
        up_z: parseFloat(upVector.z),
        fov: parseFloat(currentFOV)
    };

    if (isSameAsLastSaved(data, lastSavedPosition)) {
        console.log("POV non inviato: dati già presenti.");
        return;
    }

    fetch("http://127.0.0.1:5000/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log("POV inviato al server:", result);
        lastSavedPosition = data;
    })
    .catch(error => console.error("Errore nell'invio del POV:", error));
}



function monitorPOV() {
    setInterval(() => {
        
        povVector = camera.getWorldDirection(new THREE.Vector3());
        const currentPosition = { 
            x: camera.position.x, 
            y: camera.position.y, 
            z: camera.position.z 
        };
        const currentDirection = { 
            x: povVector.x, 
            y: povVector.y, 
            z: povVector.z 
        };
        const currentUpVector = { 
            x: camera.up.x, 
            y: camera.up.y, 
            z: camera.up.z 
        };

        if (
            isStable(currentPosition, lastPosition, STABLE_THRESHOLD) &&
            isStable(currentDirection, lastDirection, STABLE_THRESHOLD) &&
            isStable(currentUpVector, lastUpVector, STABLE_THRESHOLD)
        ) {
            sendPOVData();  
            }
        

        lastPosition = currentPosition;
        lastDirection = currentDirection;
        lastUpVector = currentUpVector;
    }, CHECK_INTERVAL);
}





document.addEventListener("DOMContentLoaded", monitorPOV);
>>>>>>> 6874737b699f7a1ca2bf6e1b80e3dfb4816ec9bc
