#![no_std]

use soroban_sdk::{contract, contractimpl, map, symbol_short, Env, String, Map, Symbol, Vec};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    // -----------------------------
    // Estudiantes
    // -----------------------------
    pub fn insert_estudiante(env: Env, id: String, nombre: String, email: String) {
        let mut estudiantes: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("estd"))
            .unwrap_or_else(|| Map::new(&env));

        let estudiante_data = map![
            &env,
            (symbol_short!("nombre"), nombre),
            (symbol_short!("email"), email),
        ];

        estudiantes.set(id.clone(), estudiante_data);
        env.storage().persistent().set(&symbol_short!("estd"), &estudiantes);
    }

    pub fn buscar_estudiantes(env: Env, nombre: String) -> Option<Map<Symbol, String>> {
        let estudiantes: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("estd"))
            .unwrap_or_else(|| Map::new(&env));

        estudiantes
            .iter()
            .find(|(_, data)| {
                data.get(symbol_short!("nombre"))
                    .map(|n| n == nombre)
                    .unwrap_or(false)
            })
            .map(|(_, data)| data.clone())
    }

    // -----------------------------
    // Docentes
    // -----------------------------
    pub fn insert_docente(env: Env, id: String, nombre: String, apellidos: String, materia: String) {
        let mut docentes: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("docnt"))
            .unwrap_or_else(|| Map::new(&env));

        let docente_data = map![
            &env,
            (symbol_short!("nombre"), nombre),
            (symbol_short!("apell"), apellidos),
            (symbol_short!("materia"), materia),
        ];

        docentes.set(id.clone(), docente_data);
        env.storage().persistent().set(&symbol_short!("docnt"), &docentes);
    }

    // -----------------------------
    // Cursos
    // -----------------------------
    pub fn registrar(env: Env, id_curso: String, materia: String, titulo: String, id_docente: String) {
        let mut cursos: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("curs"))
            .unwrap_or_else(|| Map::new(&env));

        let curso_data = map![
            &env,
            (symbol_short!("materia"), materia),
            (symbol_short!("titulo"), titulo),
            (symbol_short!("id_docnt"), id_docente),
        ];

        cursos.set(id_curso.clone(), curso_data);
        env.storage().persistent().set(&symbol_short!("curs"), &cursos);
    }

    pub fn buscar_cursos(env: Env, filtro: String) -> Vec<(String, Map<Symbol, String>)> {
        let cursos: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("curs"))
            .unwrap_or_else(|| Map::new(&env));

        let mut resultados: Vec<(String, Map<Symbol, String>)> = Vec::new(&env);

        for (id, data) in cursos.iter() {
            let match_id = id == filtro;
            let match_materia = data.get(symbol_short!("materia")).map(|m| m == filtro).unwrap_or(false);
            let match_titulo = data.get(symbol_short!("titulo")).map(|t| t == filtro).unwrap_or(false);
            let match_doc = data.get(symbol_short!("id_docnt")).map(|d| d == filtro).unwrap_or(false);

            if match_id || match_materia || match_titulo || match_doc {
                resultados.push_back((id, data));
            }
        }

        resultados
    }

    // -----------------------------
    // Documentos
    // -----------------------------
    pub fn cargar_documento(env: Env, id: String, titulo: String, contenido: String) {
        let mut documentos: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("docs"))
            .unwrap_or_else(|| Map::new(&env));

        let documento_data = map![
            &env,
            (symbol_short!("titulo"), titulo),
            (symbol_short!("contenido"), contenido),
        ];

        documentos.set(id.clone(), documento_data);
        env.storage().persistent().set(&symbol_short!("docs"), &documentos);
    }

    pub fn buscar_documento(env: Env, titulo: String) -> Option<Map<Symbol, String>> {
        let documentos: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("docs"))
            .unwrap_or_else(|| Map::new(&env));

        documentos
            .iter()
            .find(|(_, data)| {
                data.get(symbol_short!("titulo"))
                    .map(|t| t == titulo)
                    .unwrap_or(false)
            })
            .map(|(_, data)| data.clone())
    }

    pub fn adquirir_documento(env: Env, id: String) -> Option<Map<Symbol, String>> {
        let documentos: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("docs"))
            .unwrap_or_else(|| Map::new(&env));

        documentos.get(id)
    }

    // -----------------------------
    // Materias
    // -----------------------------
    pub fn registrar_materia(env: Env, id: String, nombre: String, creditos: String) {
        let mut materias: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("mats"))
            .unwrap_or_else(|| Map::new(&env));

        let materia_data = map![
            &env,
            (symbol_short!("nombre"), nombre),
            (symbol_short!("creditos"), creditos),
        ];

        materias.set(id.clone(), materia_data);
        env.storage().persistent().set(&symbol_short!("mats"), &materias);
    }

    pub fn buscar_materia(env: Env, nombre: String) -> Option<Map<Symbol, String>> {
        let materias: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("mats"))
            .unwrap_or_else(|| Map::new(&env));

        materias
            .iter()
            .find(|(_, data)| {
                data.get(symbol_short!("nombre"))
                    .map(|n| n == nombre)
                    .unwrap_or(false)
            })
            .map(|(_, data)| data.clone())
    }

    // -----------------------------
    // Certificados
    // -----------------------------
    pub fn generar_certificado(
        env: Env,
        id_est: String,
        id_curso: String,
        calif: String,
        titulo_cert: String,
        fecha: String,
    ) -> Option<Map<Symbol, String>> {
        let estudiantes: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("estd"))
            .unwrap_or_else(|| Map::new(&env));
        let estudiante = estudiantes.get(id_est.clone())?;

        let cursos: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("curs"))
            .unwrap_or_else(|| Map::new(&env));
        let curso = cursos.get(id_curso.clone())?;

        let id_docente = curso.get(symbol_short!("id_docnt"))?;

        let docentes: Map<String, Map<Symbol, String>> = env
            .storage()
            .persistent()
            .get(&symbol_short!("docnt"))
            .unwrap_or_else(|| Map::new(&env));
        let docente = docentes.get(id_docente.clone())?;

        let certificado = map![
            &env,
            (symbol_short!("titulo"), titulo_cert),
            (symbol_short!("fecha"), fecha),
            (symbol_short!("est_nom"), estudiante.get(symbol_short!("nombre")).unwrap_or(String::from_str(&env, ""))),
            (symbol_short!("est_mail"), estudiante.get(symbol_short!("email")).unwrap_or(String::from_str(&env, ""))),
            (symbol_short!("materia"), curso.get(symbol_short!("materia")).unwrap_or(String::from_str(&env, ""))),
            (symbol_short!("calif"), calif),
            (symbol_short!("doc_nom"), docente.get(symbol_short!("nombre")).unwrap_or(String::from_str(&env, ""))),
            (symbol_short!("doc_apell"), docente.get(symbol_short!("apell")).unwrap_or(String::from_str(&env, ""))),
        ];

        Some(certificado)
    }
}

mod test;
