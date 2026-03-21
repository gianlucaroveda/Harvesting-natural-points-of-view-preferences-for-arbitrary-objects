<<<<<<< HEAD
let questionDiv = document.getElementById ('question');
let optionsDiv = document.getElementById('options');
let prevBtn = document.getElementById('prevBtn');
let nextBtn = document.getElementById('nextBtn');
let terminaBtn = document.getElementById('terminaBtn');


let questions = [
    //esempio
  ];

let questions_ing = [//example
    { 
        title: "QUESTION 1", 
        text: "Which of these artifacts is the oldest?", 
        mode: 0 //multiplemesh
    },

   { 
        title: "QUESTION 2", 
        text: "What is this knife suitable for?", 
        mode: 1, //photo mode
        mesh: () => loadMeshWithOrbitControls('ModelliCC0/coltelli/knife.glb', 'knife.glb', true,2,5,2),
        name: "knife.glb",
        path: "ModelliCC0/coltelli/knife.glb",
        light: "directional",
        trackball: "orbit"
    },
    { 
        title: "QUESTION 4", 
        text: "Take one photo for this vase.", 
        mode: 2, //single mesh
        mesh: () => loadMeshWithOrbitControls('ModelliCC0/vasi/vase2.glb', 'vase2.glb', true, 0, 2, 2),
        name: "vase2.glb",
        path: "ModelliCC0/vasi/vase2.glb",
        light: "directional",
        trackball: "orbit"
    }
];

//Answers
let questionOptions = [

    ];
    
let questionOptions_ing = [
    [ // multiple mesh mode options
        { 
            value: "1", 
            label: "Artifact 1", 
            mesh: () => loadMeshWithOrbitControls('ModelliCC0/archeologi/statue1.glb', 'statue1.glb', true,2,4),
            name: "statue1.glb",
            path: "ModelliCC0/archeologi/statue1.glb",
            light: "directional",
            trackball: "orbit"
        },
        { 
            value: "2", 
            label: "Artifact 2", 
            mesh: () => loadMeshWithOrbitControls('ModelliCC0/archeologi/statue.glb', 'statue.glb', false,2,4),
            name: "statue.glb",
            path: "ModelliCC0/archeologi/statue.glb",
            light: "directional",
            trackball: "orbit"
        },
        { 
            value: "3", 
            label: "Artifact 3", 
            mesh: () => loadMeshWithOrbitControls('ModelliCC0/archeologi/statue2.glb', 'statue2.glb',false,2,1),
            name: "statue2.glb",
            path: "ModelliCC0/archeologi/statue2.glb",
            light: "ambient", 
            trackball: "orbit"
        }
    ],
    [], // Photo mode already handled in main array via mode 2
    [ // Sigle mesh mode options 
        { value: "1", label: "Bread" },
        { value: "2", label: "Meat" },
        { value: "3", label: "Vegetables" }
    ]
];


async function syncOptionsToDatabase() {
    const payload = [];
    
    const typeMapping = {
        "0": "multi_model",
        "1": "single_model",
        "2": "photo_model"
    };

    questions_ing.forEach((q, index) => {
        if ((q.mode === 1 || q.mode === 2) && q.name) {
            payload.push({
                QuestionText: q.text.trim(),
                QuestionType: typeMapping[q.mode.toString()], 
                Model_name: q.name,
                Lighting: q.light === true ? "directional" : (q.light || "ambient"),
                Trackball: q.trackball || "orbit"
            });
        } 
        
        if (q.mode === 0 && questionOptions_ing[index]) {
            questionOptions_ing[index].forEach(opt => {
                if (opt.name) {
                    payload.push({
                        QuestionText: q.text.trim(),
                        QuestionType: "multi_model",
                        Model_name: opt.name,
                        Lighting: opt.light === true ? "directional" : (opt.light || "ambient"),
                        Trackball: opt.trackball || "orbit"
                    });
                }
            });
        }
    });

    // Invio al server
    try {
        const response = await fetch("http://127.0.0.1:5000/insert_options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        alert(result.message || "Sincronizzazione completata!");
    } catch (error) {
        console.error("Errore:", error);
        alert("Errore durante la sincronizzazione delle opzioni.");
    }
}


async function verifyAndRegisterMeshes() {
    const meshMap = new Map(); 

    questions_ing.forEach(q => { 
        if (q.name && q.path) meshMap.set(q.name, q.path); 
    });

    questionOptions_ing.flat().forEach(opt => { 
        if (opt.name && opt.path) meshMap.set(opt.name, opt.path); 
    });

    const namesArray = Array.from(meshMap.keys());

    const response = await fetch("http://127.0.0.1:5000/check_meshes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: namesArray })
    });
    const { missing } = await response.json();

    if (missing.length > 0) {
        if (confirm(`Missing objects: ${missing.join(', ')}. Register automatically?`)) {
            const loader = new THREE.GLTFLoader();
            
            for (const meshName of missing) {
                const meshPath = meshMap.get(meshName); 
                
                try {
                    const gltf = await new Promise((res, rej) => loader.load(meshPath, res, undefined, rej));
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const sphere = box.getBoundingSphere(new THREE.Sphere());
                    const s = 1.0 / sphere.radius;

                    const matrix = new THREE.Matrix4();
                    matrix.makeScale(s, s, s);
                    matrix.multiply(new THREE.Matrix4().makeTranslation(-sphere.center.x, -sphere.center.y, -sphere.center.z));

                    await fetch("http://127.0.0.1:5000/insert_mesh_info", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            mesh_name: meshName,
                            matrix: Array.from(matrix.elements)
                        })
                    });
                    console.log(`Successfully registered: ${meshName}`);
                } catch (err) {
                    console.error(`Failed to load/register ${meshName}:`, err);
                }
            }
            alert("Registration completed.");
        } else {
            window.location.href = "normalization.html";
        }
    }
}

let selectedAnswers = Array(questionOptions_ing.length).fill(null);
let currentQuestionIndex = 0;

function setActiveButton(index) {
    document.querySelectorAll('.circle').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.circle')[index].classList.add('active');
}
let interactionTracker = {}; 

const optionContainers = document.querySelectorAll('.option-container');

function loadQuestion(index) {
    const language = sessionStorage.getItem("language") || "en";
    const optionsArray = (language === "en") ? questionOptions_ing : questionOptions;
    const questionArray = (language === "en") ? questions_ing : questions;

    const question = questionArray[index];
    questionDiv.innerHTML = `<h1 id="titolo-text">${question.title}</h1><p class="question-text" id="domanda">${question.text}</p>`;
    optionsDiv.innerHTML = "";

    if (question.mode === 1 || question.mode === 2) {
        if (typeof question.mesh === 'function') {
            question.mesh();
        }
        
        if (question.mode === 2) {
            nextBtn.style.display = "none";
            Deactivate = true 
            const container = document.createElement('div');
            container.classList.add("option-container");
            container.classList.add("photo-option-container");

            const textLabel = document.createElement('span');
            textLabel.classList.add("option-text");
            textLabel.textContent = language === "en" ? "Take Photo" : "Scatta Foto";
        
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add("button-container");

            container.addEventListener('click', () => {
                if (isBlurred) {
                    const alertMessage = language === "en"
                        ? "Please interact with the object before taking the photo."
                        : "Per favore interagisci con l'oggetto prima di scattare la foto.";
                    alert(alertMessage);
                    return;
                }
                const questionSnapshot = questions_ing[currentQuestionIndex];

                Savedata(questionSnapshot);

                nextBtn.style.display = "inline-block";
                Deactivate = false;
                selectedAnswers[currentQuestionIndex] = 1;

                nextQuestionPicture();
            });

            container.appendChild(textLabel);
            container.appendChild(buttonContainer);
            optionsDiv.appendChild(container);
        }
            
    }
    optionsArray[index].forEach((option, i) => {
        const container = document.createElement('div');
        container.classList.add("option-container");
        container.dataset.value = option.value;

        const textLabel = document.createElement('span');
        textLabel.classList.add("option-text");
        textLabel.textContent = option.label;

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add("button-container");

        const radio = document.createElement('input');
        radio.type = "radio";
        radio.name = "answer";
        radio.classList.add("radio-option");
        radio.value = option.value;
        if (selectedAnswers[index] == option.value) {
            radio.checked = true;
            container.classList.add("selected");
        }
        radio.addEventListener('change', (event) => {
            selectedAnswers[currentQuestionIndex] = event.target.value;
            document.querySelectorAll(".option-container").forEach(el => el.classList.remove("selected"));
            container.classList.add("selected");
        });

        const radioLabel = document.createElement('label');
        radioLabel.classList.add("radio-label");
        radioLabel.appendChild(radio);

        buttonContainer.appendChild(radioLabel);
        container.appendChild(textLabel);
        container.appendChild(buttonContainer);
        optionsDiv.appendChild(container);

        container.addEventListener("click", () => {
            radio.checked = true;
            selectedAnswers[currentQuestionIndex] = radio.value;
            document.querySelectorAll(".option-container").forEach(el => el.classList.remove("selected"));
            container.classList.add("selected");

            if (question.mode === 0 || question.mode === undefined) {
                if (!interactionTracker[currentQuestionIndex]) {
                    interactionTracker[currentQuestionIndex] = new Set();
                }
                interactionTracker[currentQuestionIndex].add(radio.value);
            }

            if (!question.mode && typeof option.mesh === 'function') {
                option.mesh();
            }
        });    
    });
    
    nextBtn.style.display = index === questions_ing.length - 1 ? "none" : "inline-block";
    terminaBtn.style.display = index === questionOptions_ing.length - 1 ? "inline-block" : "none";    
}

function nextQuestionPicture() {
    if (currentQuestionIndex < questions_ing.length - 1) {
        hideCurrentMesh()
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
        
    }
}

function nextQuestion() {
    const language = sessionStorage.getItem("language") || "en";
    const questionArray = (language === "en") ? questions_ing : questions_ing;
    const optionsArray = (language === "en") ? questionOptions_ing : questionOptions_ing;

    const question = questionArray[currentQuestionIndex];
    const mode = question.mode;

    if (mode === 2) {
        return;
    }

    if (mode === 0 || mode === undefined) {
        const currentOptions = optionsArray[currentQuestionIndex];
        const totalOptions = currentOptions.length;
    
        if (!interactionTracker[currentQuestionIndex]) {
            interactionTracker[currentQuestionIndex] = new Set();
        }

        document.querySelectorAll('input[name="answer"]:checked').forEach(input => {
            interactionTracker[currentQuestionIndex].add(input.value);
        });
        const interactionCount = interactionTracker[currentQuestionIndex].size;
        if (interactionCount < totalOptions) {
            alert(`please, interact with all ${totalOptions} option${totalOptions === 1 ? '' : 's'} before continuing.`);
            return;
        }
    }
    if (mode === 1) {
        const anySelected = document.querySelector('input[name="answer"]:checked');
        if (!anySelected) {
            alert("please, select at least one answer before continuing.");
            return;
        }
    }
    interactionTracker[currentQuestionIndex] = null;

    if (currentQuestionIndex < questionArray.length - 1) {
        hideCurrentMesh();
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    }
}



async function syncQuestions(questions_ing) {

    const cleanQuestions = questions_ing.map(({ text, mode }) => ({ 
        text: text.trim(), 
        mode 
    }));

    try {
        const response = await fetch('http://127.0.0.1:5000/insert_question_info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanQuestions)
        });
        
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || `Errore: ${response.status}`);

        console.log("Questions inserted:", result.message);
        
    } catch (error) {
        console.error("Errore syncQuestions:", error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    verifyAndRegisterMeshes();
    syncQuestions(questions_ing);
    syncOptionsToDatabase();
});

loadQuestion(0);

function finishQuestionnaire() {
    let allAnswered = selectedAnswers.every(answer => answer !== null);
    const language = sessionStorage.getItem("language") || "en";
    if(language =="en"){
        if (allAnswered) {
            alert('✅ COMPLETE!');
            window.location.href = "thank.html";
            
        } else {
            alert('⚠️ You have to answer every question.');
        }
    } else {
        if (allAnswered) {
            alert('✅ Questionario completato con successo!');
            window.location.href = "thank.html";
            
        } else {
            alert('⚠️ Devi rispondere a tutte le domande prima di terminare.');
        }
    }
}


=======
let questionDiv = document.getElementById ('question');
let optionsDiv = document.getElementById('options');
let prevBtn = document.getElementById('prevBtn');
let nextBtn = document.getElementById('nextBtn');
let terminaBtn = document.getElementById('terminaBtn');


let questions = [
    //esempio
  ];

let questions_ing = [//example
    { 
        title: "QUESTION 1", 
        text: "Which of these artifacts is the oldest?", 
        mode: 0 //multiplemesh
    },

   { 
        title: "QUESTION 2", 
        text: "What is this knife suitable for?", 
        mode: 1, //photo mode
        mesh: () => loadMeshWithOrbitControls('ModelliCC0/coltelli/knife.glb', 'knife.glb', true,2,5,2),
        name: "knife.glb",
        path: "ModelliCC0/coltelli/knife.glb",
        light: "directional",
        trackball: "orbit"
    },
    { 
        title: "QUESTION 4", 
        text: "Take one photo for this vase.", 
        mode: 2, //single mesh
        mesh: () => loadMeshWithOrbitControls('ModelliCC0/vasi/vase2.glb', 'vase2.glb', true, 0, 2, 2),
        name: "vase2.glb",
        path: "ModelliCC0/vasi/vase2.glb",
        light: "directional",
        trackball: "orbit"
    }
];

//Answers
let questionOptions = [

    ];
    
let questionOptions_ing = [
    [ // multiple mesh mode options
        { 
            value: "1", 
            label: "Artifact 1", 
            mesh: () => loadMeshWithOrbitControls('ModelliCC0/archeologi/statue1.glb', 'statue1.glb', true,2,4),
            name: "statue1.glb",
            path: "ModelliCC0/archeologi/statue1.glb",
            light: "directional",
            trackball: "orbit"
        },
        { 
            value: "2", 
            label: "Artifact 2", 
            mesh: () => loadMeshWithOrbitControls('ModelliCC0/archeologi/statue.glb', 'statue.glb', false,2,4),
            name: "statue.glb",
            path: "ModelliCC0/archeologi/statue.glb",
            light: "directional",
            trackball: "orbit"
        },
        { 
            value: "3", 
            label: "Artifact 3", 
            mesh: () => loadMeshWithOrbitControls('ModelliCC0/archeologi/statue2.glb', 'statue2.glb',false,2,1),
            name: "statue2.glb",
            path: "ModelliCC0/archeologi/statue2.glb",
            light: "ambient", 
            trackball: "orbit"
        }
    ],
    [], // Photo mode already handled in main array via mode 2
    [ // Sigle mesh mode options 
        { value: "1", label: "Bread" },
        { value: "2", label: "Meat" },
        { value: "3", label: "Vegetables" }
    ]
];


async function syncOptionsToDatabase() {
    const payload = [];
    
    const typeMapping = {
        "0": "multi_model",
        "1": "single_model",
        "2": "photo_model"
    };

    questions_ing.forEach((q, index) => {
        if ((q.mode === 1 || q.mode === 2) && q.name) {
            payload.push({
                QuestionText: q.text.trim(),
                QuestionType: typeMapping[q.mode.toString()], 
                Model_name: q.name,
                Lighting: q.light === true ? "directional" : (q.light || "ambient"),
                Trackball: q.trackball || "orbit"
            });
        } 
        
        if (q.mode === 0 && questionOptions_ing[index]) {
            questionOptions_ing[index].forEach(opt => {
                if (opt.name) {
                    payload.push({
                        QuestionText: q.text.trim(),
                        QuestionType: "multi_model",
                        Model_name: opt.name,
                        Lighting: opt.light === true ? "directional" : (opt.light || "ambient"),
                        Trackball: opt.trackball || "orbit"
                    });
                }
            });
        }
    });

    // Invio al server
    try {
        const response = await fetch("http://127.0.0.1:5000/insert_options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        alert(result.message || "Sincronizzazione completata!");
    } catch (error) {
        console.error("Errore:", error);
        alert("Errore durante la sincronizzazione delle opzioni.");
    }
}


async function verifyAndRegisterMeshes() {
    const meshMap = new Map(); 

    questions_ing.forEach(q => { 
        if (q.name && q.path) meshMap.set(q.name, q.path); 
    });

    questionOptions_ing.flat().forEach(opt => { 
        if (opt.name && opt.path) meshMap.set(opt.name, opt.path); 
    });

    const namesArray = Array.from(meshMap.keys());

    const response = await fetch("http://127.0.0.1:5000/check_meshes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: namesArray })
    });
    const { missing } = await response.json();

    if (missing.length > 0) {
        if (confirm(`Missing objects: ${missing.join(', ')}. Register automatically?`)) {
            const loader = new THREE.GLTFLoader();
            
            for (const meshName of missing) {
                const meshPath = meshMap.get(meshName); 
                
                try {
                    const gltf = await new Promise((res, rej) => loader.load(meshPath, res, undefined, rej));
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const sphere = box.getBoundingSphere(new THREE.Sphere());
                    const s = 1.0 / sphere.radius;

                    const matrix = new THREE.Matrix4();
                    matrix.makeScale(s, s, s);
                    matrix.multiply(new THREE.Matrix4().makeTranslation(-sphere.center.x, -sphere.center.y, -sphere.center.z));

                    await fetch("http://127.0.0.1:5000/insert_mesh_info", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            mesh_name: meshName,
                            matrix: Array.from(matrix.elements)
                        })
                    });
                    console.log(`Successfully registered: ${meshName}`);
                } catch (err) {
                    console.error(`Failed to load/register ${meshName}:`, err);
                }
            }
            alert("Registration completed.");
        } else {
            window.location.href = "normalization.html";
        }
    }
}

let selectedAnswers = Array(questionOptions_ing.length).fill(null);
let currentQuestionIndex = 0;

function setActiveButton(index) {
    document.querySelectorAll('.circle').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.circle')[index].classList.add('active');
}
let interactionTracker = {}; 

const optionContainers = document.querySelectorAll('.option-container');

function loadQuestion(index) {
    const language = sessionStorage.getItem("language") || "en";
    const optionsArray = (language === "en") ? questionOptions_ing : questionOptions;
    const questionArray = (language === "en") ? questions_ing : questions;

    const question = questionArray[index];
    questionDiv.innerHTML = `<h1 id="titolo-text">${question.title}</h1><p class="question-text" id="domanda">${question.text}</p>`;
    optionsDiv.innerHTML = "";

    if (question.mode === 1 || question.mode === 2) {
        if (typeof question.mesh === 'function') {
            question.mesh();
        }
        
        if (question.mode === 2) {
            nextBtn.style.display = "none";
            Deactivate = true 
            const container = document.createElement('div');
            container.classList.add("option-container");
            container.classList.add("photo-option-container");

            const textLabel = document.createElement('span');
            textLabel.classList.add("option-text");
            textLabel.textContent = language === "en" ? "Take Photo" : "Scatta Foto";
        
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add("button-container");

            container.addEventListener('click', () => {
                if (isBlurred) {
                    const alertMessage = language === "en"
                        ? "Please interact with the object before taking the photo."
                        : "Per favore interagisci con l'oggetto prima di scattare la foto.";
                    alert(alertMessage);
                    return;
                }
                const questionSnapshot = questions_ing[currentQuestionIndex];

                Savedata(questionSnapshot);

                nextBtn.style.display = "inline-block";
                Deactivate = false;
                selectedAnswers[currentQuestionIndex] = 1;

                nextQuestionPicture();
            });

            container.appendChild(textLabel);
            container.appendChild(buttonContainer);
            optionsDiv.appendChild(container);
        }
            
    }
    optionsArray[index].forEach((option, i) => {
        const container = document.createElement('div');
        container.classList.add("option-container");
        container.dataset.value = option.value;

        const textLabel = document.createElement('span');
        textLabel.classList.add("option-text");
        textLabel.textContent = option.label;

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add("button-container");

        const radio = document.createElement('input');
        radio.type = "radio";
        radio.name = "answer";
        radio.classList.add("radio-option");
        radio.value = option.value;
        if (selectedAnswers[index] == option.value) {
            radio.checked = true;
            container.classList.add("selected");
        }
        radio.addEventListener('change', (event) => {
            selectedAnswers[currentQuestionIndex] = event.target.value;
            document.querySelectorAll(".option-container").forEach(el => el.classList.remove("selected"));
            container.classList.add("selected");
        });

        const radioLabel = document.createElement('label');
        radioLabel.classList.add("radio-label");
        radioLabel.appendChild(radio);

        buttonContainer.appendChild(radioLabel);
        container.appendChild(textLabel);
        container.appendChild(buttonContainer);
        optionsDiv.appendChild(container);

        container.addEventListener("click", () => {
            radio.checked = true;
            selectedAnswers[currentQuestionIndex] = radio.value;
            document.querySelectorAll(".option-container").forEach(el => el.classList.remove("selected"));
            container.classList.add("selected");

            if (question.mode === 0 || question.mode === undefined) {
                if (!interactionTracker[currentQuestionIndex]) {
                    interactionTracker[currentQuestionIndex] = new Set();
                }
                interactionTracker[currentQuestionIndex].add(radio.value);
            }

            if (!question.mode && typeof option.mesh === 'function') {
                option.mesh();
            }
        });    
    });
    
    nextBtn.style.display = index === questions_ing.length - 1 ? "none" : "inline-block";
    terminaBtn.style.display = index === questionOptions_ing.length - 1 ? "inline-block" : "none";    
}

function nextQuestionPicture() {
    if (currentQuestionIndex < questions_ing.length - 1) {
        hideCurrentMesh()
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
        
    }
}

function nextQuestion() {
    const language = sessionStorage.getItem("language") || "en";
    const questionArray = (language === "en") ? questions_ing : questions_ing;
    const optionsArray = (language === "en") ? questionOptions_ing : questionOptions_ing;

    const question = questionArray[currentQuestionIndex];
    const mode = question.mode;

    if (mode === 2) {
        return;
    }

    if (mode === 0 || mode === undefined) {
        const currentOptions = optionsArray[currentQuestionIndex];
        const totalOptions = currentOptions.length;
    
        if (!interactionTracker[currentQuestionIndex]) {
            interactionTracker[currentQuestionIndex] = new Set();
        }

        document.querySelectorAll('input[name="answer"]:checked').forEach(input => {
            interactionTracker[currentQuestionIndex].add(input.value);
        });
        const interactionCount = interactionTracker[currentQuestionIndex].size;
        if (interactionCount < totalOptions) {
            alert(`please, interact with all ${totalOptions} option${totalOptions === 1 ? '' : 's'} before continuing.`);
            return;
        }
    }
    if (mode === 1) {
        const anySelected = document.querySelector('input[name="answer"]:checked');
        if (!anySelected) {
            alert("please, select at least one answer before continuing.");
            return;
        }
    }
    interactionTracker[currentQuestionIndex] = null;

    if (currentQuestionIndex < questionArray.length - 1) {
        hideCurrentMesh();
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    }
}



async function syncQuestions(questions_ing) {

    const cleanQuestions = questions_ing.map(({ text, mode }) => ({ 
        text: text.trim(), 
        mode 
    }));

    try {
        const response = await fetch('http://127.0.0.1:5000/insert_question_info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanQuestions)
        });
        
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || `Errore: ${response.status}`);

        console.log("Questions inserted:", result.message);
        
    } catch (error) {
        console.error("Errore syncQuestions:", error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    verifyAndRegisterMeshes();
    syncQuestions(questions_ing);
    syncOptionsToDatabase();
});

loadQuestion(0);

function finishQuestionnaire() {
    let allAnswered = selectedAnswers.every(answer => answer !== null);
    const language = sessionStorage.getItem("language") || "en";
    if(language =="en"){
        if (allAnswered) {
            alert('✅ COMPLETE!');
            window.location.href = "thank.html";
            
        } else {
            alert('⚠️ You have to answer every question.');
        }
    } else {
        if (allAnswered) {
            alert('✅ Questionario completato con successo!');
            window.location.href = "thank.html";
            
        } else {
            alert('⚠️ Devi rispondere a tutte le domande prima di terminare.');
        }
    }
}


>>>>>>> 6874737b699f7a1ca2bf6e1b80e3dfb4816ec9bc
