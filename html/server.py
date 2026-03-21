<<<<<<< HEAD
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:8000", "http://127.0.0.1:8000"], supports_credentials=True)


#settings
DB_CONFIG = {
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


@app.route('/insert', methods=['POST'])
def insert_data():
    try:
        data = request.json 
        print("Dati ricevuti:", data)  

        user_id = data["id"]
        model_name = data["mesh_name"]
        q_text = data["question_text"]
        q_type = data["question_type"]

        pov = [data["pov_x"], data["pov_y"], data["pov_z"]]
        view_dir = [data["dir_x"], data["dir_y"], data["dir_z"]]
        up_vector = [data["up_x"], data["up_y"], data["up_z"]]
        fov = data["fov"]

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO Pov_data (
                UserID, Model_name, QuestionText, QuestionType, 
                POV_x_y_z, ViewDir, UpVector, FOV
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, model_name, q_text, q_type, pov, view_dir, up_vector, fov))
        
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Dati inseriti!"}), 200

    except Exception as e:
        print(f"Errore: {str(e)}")  
        return jsonify({"error": str(e)}), 500

@app.route('/insert_mesh_info', methods=['POST'])
def insert_mesh_info():
    conn = None
    try:
        data = request.json
        mesh_name = data.get("mesh_name")
        matrix = data.get("matrix") 

        if not mesh_name or matrix is None:
            return jsonify({"error": "Dati mancanti"}), 400
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO Model (Model_name, Normalization_matrix)
            VALUES (%s, %s)
            ON CONFLICT (Model_name) 
            DO UPDATE SET Normalization_matrix = EXCLUDED.Normalization_matrix
        """, (mesh_name, matrix))

        conn.commit()
        cur.close()
        
        return jsonify({"status": "success", "message": f"Modello '{mesh_name}' salvato"}), 200

    except Exception as e:
        print(f"Errore SQL: {str(e)}")
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    

@app.route('/check_meshes', methods=['POST'])
def check_meshes():
    try:
        names_to_check = request.json.get("names", [])
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT Model_name FROM Model WHERE Model_name = ANY(%s)", (names_to_check,))
        existing_names = [row[0] for row in cur.fetchall()]

        missing_names = list(set(names_to_check) - set(existing_names))
        
        cur.close()
        return jsonify({"missing": missing_names}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/insert_users', methods=['POST'])
def insert_utenti():
    try:
        data = request.json  

        user_id = data["id"]  
        age = data["age"]
        exp = data["exp"]

        print(f"Inserimento dati: ID={user_id}, Età={age}, Esperienza={exp}")  

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO users (id, age, exp)
            VALUES (%s, %s, %s)
        """, (user_id, age, exp))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Dati inseriti con successo nella tabella utenti!"}), 200

    except Exception as e:
        print(f"Errore: {str(e)}") 
        return jsonify({"error": str(e)}), 500
    
    
    
@app.route('/get_pov_data', methods=['GET'])
def get_pov_data():
    try:
        mesh_name = request.args.get('mesh_name')
        if not mesh_name:
            return jsonify({"error": "Parametro 'mesh_name' mancante"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, mesh_name, pov_x, pov_y, pov_z, dir_x, dir_y, dir_z, up_x, up_y, up_z, fov
            FROM pov_data
            WHERE mesh_name = %s
        """, (mesh_name,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        pov_list = []
        for row in rows:
            pov_list.append({
                "id": row[0],
                "mesh_name": row[1],
                "pov": {"x": row[2], "y": row[3], "z": row[4]},
                "dir": {"x": row[5], "y": row[6], "z": row[7]},
                "up": {"x": row[8], "y": row[9], "z": row[10]},
                "fov": row[11]
            })

        return jsonify(pov_list), 200

    except Exception as e:
        print(f"Errore durante il recupero dei dati POV: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/insert_options', methods=['POST'])
def insert_options():
    conn = None
    try:
        data_list = request.json
        conn = get_db_connection()
        cur = conn.cursor()

        for item in data_list:
          
            lighting = item['Lighting'] if item['Lighting'] in ['ambient', 'directional'] else 'ambient'
            trackball = item['Trackball'] if item['Trackball'] in ['orbit', 'trackball'] else 'orbit'

            cur.execute("""
                INSERT INTO Option (QuestionText, QuestionType, Model_name, Lighting, Trackball)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (QuestionText, QuestionType, Model_name) 
                DO UPDATE SET 
                    Lighting = EXCLUDED.Lighting,
                    Trackball = EXCLUDED.Trackball
            """, (
                item['QuestionText'],
                item['QuestionType'],
                item['Model_name'],
                lighting,
                trackball
            ))

        conn.commit()
        cur.close()
        return jsonify({"status": "success", "message": f"Sincronizzate {len(data_list)} opzioni nel DB"}), 200

    except Exception as e:
        if conn: conn.rollback()
        print(f"Errore: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/get_mesh_matrix/<mesh_name>', methods=['GET'])
def get_mesh_matrix(mesh_name):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT Normalization_matrix FROM Model WHERE Model_name = %s", (mesh_name,))
        row = cur.fetchone()
        cur.close()
        
        if row:
            return jsonify({"matrix": row[0]}), 200
        
        return jsonify({"error": "Mesh not found", "matrix": None}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500    



@app.route('/insert_question_info', methods=['POST'])
def insert_question_info():
    conn = None
    try:
        data = request.json 

        mode_mapping = {
            0: 'multi_model',
            1: 'single_model',
            2: 'photo_model'
        }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        for q in data:
            q_text = q['text'].strip()
            q_type = mode_mapping.get(q['mode'], 'multi_model')

            cur.execute("""
                INSERT INTO Question (Text, Type)
                VALUES (%s, %s)
                ON CONFLICT (Text, Type) DO NOTHING
            """, (q_text, q_type))

        conn.commit()
        cur.close()
        return jsonify({"status": "success", "message": "Domande caricate"}), 200
        
    except Exception as e:
        print(f"Errore durante il recupero dei dati POV: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
=======
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:8000", "http://127.0.0.1:8000"], supports_credentials=True)


#settings
DB_CONFIG = {
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


@app.route('/insert', methods=['POST'])
def insert_data():
    try:
        data = request.json 
        print("Dati ricevuti:", data)  

        user_id = data["id"]
        model_name = data["mesh_name"]
        q_text = data["question_text"]
        q_type = data["question_type"]

        pov = [data["pov_x"], data["pov_y"], data["pov_z"]]
        view_dir = [data["dir_x"], data["dir_y"], data["dir_z"]]
        up_vector = [data["up_x"], data["up_y"], data["up_z"]]
        fov = data["fov"]

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO Pov_data (
                UserID, Model_name, QuestionText, QuestionType, 
                POV_x_y_z, ViewDir, UpVector, FOV
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, model_name, q_text, q_type, pov, view_dir, up_vector, fov))
        
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Dati inseriti!"}), 200

    except Exception as e:
        print(f"Errore: {str(e)}")  
        return jsonify({"error": str(e)}), 500

@app.route('/insert_mesh_info', methods=['POST'])
def insert_mesh_info():
    conn = None
    try:
        data = request.json
        mesh_name = data.get("mesh_name")
        matrix = data.get("matrix") 

        if not mesh_name or matrix is None:
            return jsonify({"error": "Dati mancanti"}), 400
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO Model (Model_name, Normalization_matrix)
            VALUES (%s, %s)
            ON CONFLICT (Model_name) 
            DO UPDATE SET Normalization_matrix = EXCLUDED.Normalization_matrix
        """, (mesh_name, matrix))

        conn.commit()
        cur.close()
        
        return jsonify({"status": "success", "message": f"Modello '{mesh_name}' salvato"}), 200

    except Exception as e:
        print(f"Errore SQL: {str(e)}")
        if conn: conn.rollback()
        return jsonify({"error": str(e)}), 500
    

@app.route('/check_meshes', methods=['POST'])
def check_meshes():
    try:
        names_to_check = request.json.get("names", [])
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT Model_name FROM Model WHERE Model_name = ANY(%s)", (names_to_check,))
        existing_names = [row[0] for row in cur.fetchall()]

        missing_names = list(set(names_to_check) - set(existing_names))
        
        cur.close()
        return jsonify({"missing": missing_names}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/insert_users', methods=['POST'])
def insert_utenti():
    try:
        data = request.json  

        user_id = data["id"]  
        age = data["age"]
        exp = data["exp"]

        print(f"Inserimento dati: ID={user_id}, Età={age}, Esperienza={exp}")  

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO users (id, age, exp)
            VALUES (%s, %s, %s)
        """, (user_id, age, exp))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Dati inseriti con successo nella tabella utenti!"}), 200

    except Exception as e:
        print(f"Errore: {str(e)}") 
        return jsonify({"error": str(e)}), 500
    
    
    
@app.route('/get_pov_data', methods=['GET'])
def get_pov_data():
    try:
        mesh_name = request.args.get('mesh_name')
        if not mesh_name:
            return jsonify({"error": "Parametro 'mesh_name' mancante"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, mesh_name, pov_x, pov_y, pov_z, dir_x, dir_y, dir_z, up_x, up_y, up_z, fov
            FROM pov_data
            WHERE mesh_name = %s
        """, (mesh_name,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        pov_list = []
        for row in rows:
            pov_list.append({
                "id": row[0],
                "mesh_name": row[1],
                "pov": {"x": row[2], "y": row[3], "z": row[4]},
                "dir": {"x": row[5], "y": row[6], "z": row[7]},
                "up": {"x": row[8], "y": row[9], "z": row[10]},
                "fov": row[11]
            })

        return jsonify(pov_list), 200

    except Exception as e:
        print(f"Errore durante il recupero dei dati POV: {str(e)}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/insert_options', methods=['POST'])
def insert_options():
    conn = None
    try:
        data_list = request.json
        conn = get_db_connection()
        cur = conn.cursor()

        for item in data_list:
          
            lighting = item['Lighting'] if item['Lighting'] in ['ambient', 'directional'] else 'ambient'
            trackball = item['Trackball'] if item['Trackball'] in ['orbit', 'trackball'] else 'orbit'

            cur.execute("""
                INSERT INTO Option (QuestionText, QuestionType, Model_name, Lighting, Trackball)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (QuestionText, QuestionType, Model_name) 
                DO UPDATE SET 
                    Lighting = EXCLUDED.Lighting,
                    Trackball = EXCLUDED.Trackball
            """, (
                item['QuestionText'],
                item['QuestionType'],
                item['Model_name'],
                lighting,
                trackball
            ))

        conn.commit()
        cur.close()
        return jsonify({"status": "success", "message": f"Sincronizzate {len(data_list)} opzioni nel DB"}), 200

    except Exception as e:
        if conn: conn.rollback()
        print(f"Errore: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/get_mesh_matrix/<mesh_name>', methods=['GET'])
def get_mesh_matrix(mesh_name):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT Normalization_matrix FROM Model WHERE Model_name = %s", (mesh_name,))
        row = cur.fetchone()
        cur.close()
        
        if row:
            return jsonify({"matrix": row[0]}), 200
        
        return jsonify({"error": "Mesh not found", "matrix": None}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500    



@app.route('/insert_question_info', methods=['POST'])
def insert_question_info():
    conn = None
    try:
        data = request.json 

        mode_mapping = {
            0: 'multi_model',
            1: 'single_model',
            2: 'photo_model'
        }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        for q in data:
            q_text = q['text'].strip()
            q_type = mode_mapping.get(q['mode'], 'multi_model')

            cur.execute("""
                INSERT INTO Question (Text, Type)
                VALUES (%s, %s)
                ON CONFLICT (Text, Type) DO NOTHING
            """, (q_text, q_type))

        conn.commit()
        cur.close()
        return jsonify({"status": "success", "message": "Domande caricate"}), 200
        
    except Exception as e:
        print(f"Errore durante il recupero dei dati POV: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
>>>>>>> 6874737b699f7a1ca2bf6e1b80e3dfb4816ec9bc
    app.run(debug=True, port=5000) 