// #![cfg(test)]

// use super::*;
// use soroban_sdk::{Env, String, symbol_short};

// #[test]
// fn test_estudiante_operations() {
//     let env = Env::default();
//     let contract_id = env.register(Contract, ());
//     let client = ContractClient::new(&env, &contract_id);

//     // Insertar estudiante
//     client.insert_estudiante(
//         &String::from_str(&env, "1"),
//         &String::from_str(&env, "Carlos"),
//         &String::from_str(&env, "carlos@example.com"),
//     );

//     // Verificar inserción
//     let estudiante = client.get_estudiante(&String::from_str(&env, "1"));
//     assert!(estudiante.is_some());
//     let estudiante_data = estudiante.unwrap();
//     assert_eq!(
//         estudiante_data.get(symbol_short!("nombre")),
//         Some(String::from_str(&env, "Carlos"))
//     );
//     assert_eq!(
//         estudiante_data.get(symbol_short!("email")),
//         Some(String::from_str(&env, "carlos@example.com"))
//     );

//     // Editar estudiante
//     client.edit_estudiante(
//         &String::from_str(&env, "1"),
//         &String::from_str(&env, "Carlos Gómez"),
//         &String::from_str(&env, "carlos.gomez@example.com"),
//     );

//     // Verificar edición
//     let updated_estudiante = client.get_estudiante(&String::from_str(&env, "1"));
//     assert!(updated_estudiante.is_some());
//     let updated_data = updated_estudiante.unwrap();
//     assert_eq!(
//         updated_data.get(symbol_short!("nombre")),
//         Some(String::from_str(&env, "Carlos Gómez"))
//     );
//     assert_eq!(
//         updated_data.get(symbol_short!("email")),
//         Some(String::from_str(&env, "carlos.gomez@example.com"))
//     );

//     // Buscar estudiante
//     let search_result = client.buscar_estudiantes(&String::from_str(&env, "Carlos Gómez"));
//     assert!(search_result.is_some());

//     // Eliminar estudiante
//     client.delete_estudiante(&String::from_str(&env, "1"));

//     // Verificar eliminación
//     let deleted_estudiante = client.get_estudiante(&String::from_str(&env, "1"));
//     assert!(deleted_estudiante.is_none());


//     // Documento


// }

// Documento operations
// fn test_cargar_y_adquirir_documento() {
//     let env = Env::default();
//     let id = String::from_str(&env, "doc1");
//     let titulo = String::from_str(&env, "Título de prueba");
//     let contenido = String::from_str(&env, "Contenido de prueba");

//     cargar_documento(env.clone(), id.clone(), titulo.clone(), contenido.clone());

//     let doc = adquirir_documento(env.clone(), id.clone()).unwrap();

//     assert_eq!(doc.get(symbol_short!("titulo")), Some(titulo));
//     assert_eq!(doc.get(symbol_short!("contenido")), Some(contenido));
// }

// #[test]
// fn test_actualizar_documento() {
//     let env = Env::default();
//     let id = String::from_str(&env, "doc2");
//     let titulo = String::from_str(&env, "Viejo Título");
//     let contenido = String::from_str(&env, "Viejo Contenido");

//     cargar_documento(env.clone(), id.clone(), titulo, contenido);

//     let nuevo_titulo = String::from_str(&env, "Nuevo Título");
//     let nuevo_contenido = String::from_str(&env, "Nuevo Contenido");

//     actualizar_documento(env.clone(), id.clone(), nuevo_titulo.clone(), nuevo_contenido.clone());

//     let doc = adquirir_documento(env.clone(), id.clone()).unwrap();

//     assert_eq!(doc.get(symbol_short!("titulo")), Some(nuevo_titulo));
//     assert_eq!(doc.get(symbol_short!("contenido")), Some(nuevo_contenido));
// }

// #[test]
// fn test_eliminar_documento() {
//     let env = Env::default();
//     let id = String::from_str(&env, "doc3");
//     let titulo = String::from_str(&env, "A Eliminar");
//     let contenido = String::from_str(&env, "Contenido");

//     cargar_documento(env.clone(), id.clone(), titulo, contenido);

//     eliminar_documento(env.clone(), id.clone());

//     assert_eq!(adquirir_documento(env.clone(), id.clone()), None);
// }

// #[test]
// fn test_buscar_documento() {
//     let env = Env::default();
//     let id = String::from_str(&env, "doc4");
//     let titulo = String::from_str(&env, "Título Buscado");
//     let contenido = String::from_str(&env, "Contenido");

//     cargar_documento(env.clone(), id.clone(), titulo.clone(), contenido.clone());

//     let resultado = buscar_documento(env.clone(), titulo.clone()).unwrap();

//     assert_eq!(resultado.get(symbol_short!("titulo")), Some(titulo));
//     assert_eq!(resultado.get(symbol_short!("contenido")), Some(contenido));
// }



// //Materia
// #![cfg(test)]

// use super::*;
// use soroban_sdk::{testutils::EnvExt, Env, String, Symbol};

// #[test]
// fn test_registrar_y_buscar_materia() {
//     let env = Env::default();
//     let id = String::from_str(&env, "mat1");
//     let nombre = String::from_str(&env, "Matemáticas");
//     let creditos = String::from_str(&env, "5");

//     registrar_materia(env.clone(), id.clone(), nombre.clone(), creditos.clone());

//     let resultado = buscar_materia(env.clone(), nombre.clone()).unwrap();

//     assert_eq!(resultado.get(symbol_short!("nombre")), Some(nombre));
//     assert_eq!(resultado.get(symbol_short!("creditos")), Some(creditos));
// }

// #[test]
// fn test_actualizar_materia() {
//     let env = Env::default();
//     let id = String::from_str(&env, "mat2");
//     let nombre = String::from_str(&env, "Física");
//     let creditos = String::from_str(&env, "4");

//     registrar_materia(env.clone(), id.clone(), nombre, creditos);

//     let nuevo_nombre = String::from_str(&env, "Física Avanzada");
//     let nuevos_creditos = String::from_str(&env, "6");

//     actualizar_materia(env.clone(), id.clone(), nuevo_nombre.clone(), nuevos_creditos.clone());

//     let resultado = buscar_materia(env.clone(), nuevo_nombre.clone()).unwrap();

//     assert_eq!(resultado.get(symbol_short!("nombre")), Some(nuevo_nombre));
//     assert_eq!(resultado.get(symbol_short!("creditos")), Some(nuevos_creditos));
// }

// #[test]
// fn test_eliminar_materia() {
//     let env = Env::default();
//     let id = String::from_str(&env, "mat3");
//     let nombre = String::from_str(&env, "Historia");
//     let creditos = String::from_str(&env, "3");

//     registrar_materia(env.clone(), id.clone(), nombre.clone(), creditos);

//     eliminar_materia(env.clone(), id.clone());

//     let resultado = buscar_materia(env.clone(), nombre.clone());

//     assert!(resultado.is_none());
// }
