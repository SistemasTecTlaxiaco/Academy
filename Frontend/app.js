// ===== Login + Stellar Wallet Management (Complete) =====

// Variables del contrato
const CONTRACT_ID = 'CDS3VGIAZFIZUG3GL6LWAXLOXWCRIIBDPPRS4225LLLEHPGTFDNF4PQK';
const RPC_URL = 'https://horizon-testnet.stellar.org';
const SOROBAN_RPC_URL = 'https://rpc-testnet.stellar.org';

// Variables globales
let connectedWallet = null;
let publicKey = null;
let ultimaClavePublica = null;
let ultimaClaveSecreta = null;
let modoManual = false;

// Elementos del DOM (vinculados en DOMContentLoaded)
let imageUploadDiv, fileInput, walletStatus, walletAddress, loginBtn, loginForm, contractActions, result, userRoleSelect;
let crearCuentaBtn, usarCuentaExistenteBtn, claveSecretaManualInput, clavePublicaManualInput, stellarAccountInfo;

// Función para mostrar resultados
function showResult(message, type = 'info') {
  if (!result) return;
  result.textContent = message;
  result.classList.remove('hidden');
  result.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
  if (type === 'success') {
    result.classList.add('bg-green-100', 'text-green-800');
  } else if (type === 'error') {
    result.classList.add('bg-red-100', 'text-red-800');
  } else {
    result.classList.add('bg-blue-100', 'text-blue-800');
  }
}

// Crear y financiar cuenta Stellar Testnet
async function crearYFinanciarCuenta() {
  if (!stellarAccountInfo) return;
  stellarAccountInfo.textContent = "Iniciando proceso de creación/financiación...";
  const StellarSdk = window.StellarSdk;
  if (!StellarSdk) {
    stellarAccountInfo.textContent = "No se pudo cargar StellarSdk.";
    return;
  }

  // Si Freighter está instalado, ofrecer usar la cuenta activa
  if (typeof window.freighterApi !== 'undefined') {
    const usarFreighter = confirm('Se detectó Freighter. ¿Deseas financiar la cuenta actualmente seleccionada en Freighter (recomendado)?');
    if (usarFreighter) {
      try {
        try {
          const isAllowed = await window.freighterApi.isAllowed();
          if (!isAllowed) await window.freighterApi.setAllowed();
        } catch (permErr) {
          if (typeof window.freighterApi.connect === 'function') {
            await window.freighterApi.connect();
          }
        }

        const freighterPublic = await window.freighterApi.getPublicKey();
        stellarAccountInfo.textContent = `Cuenta Freighter detectada: ${freighterPublic}\nSolicitando fondos (friendbot)...`;
        const fbRes = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(freighterPublic)}`);
        const fbJson = await fbRes.json();
        stellarAccountInfo.textContent += `\n✅ Solicitud de friendbot enviada. Respuesta: ${JSON.stringify(fbJson)}`;

        modoManual = false;
        connectedWallet = freighterPublic;
        publicKey = freighterPublic;
        if (walletAddress) walletAddress.textContent = `Cuenta Freighter: ${freighterPublic.substring(0,10)}...${freighterPublic.substring(freighterPublic.length - 10)}`;
        if (walletStatus) {
          walletStatus.classList.remove('hidden');
          walletStatus.classList.add('bg-green-50', 'text-green-800');
        }
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.classList.remove('bg-gray-400');
          loginBtn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'hover:scale-105');
        }
        return;
      } catch (err) {
        console.error('Error financiando cuenta Freighter:', err);
        stellarAccountInfo.textContent += `\n❌ Error: ${err}`;
        const fallback = confirm('¿Deseas generar una clave nueva local en su lugar?');
        if (!fallback) return;
      }
    }
  }

  // Flujo por defecto: generar par de claves local
  stellarAccountInfo.textContent = "Generando claves locales...";
  const pair = StellarSdk.Keypair.random();
  const publicKeyGen = pair.publicKey();
  const secretKey = pair.secret();
  ultimaClavePublica = publicKeyGen;
  ultimaClaveSecreta = secretKey;
  stellarAccountInfo.textContent = `Public Key: ${publicKeyGen}\nSecret Key: ${secretKey}\n\nFinanciando cuenta...`;
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKeyGen)}`);
    const responseJSON = await response.json();
    stellarAccountInfo.textContent += `\n✅ Cuenta financiada\n${JSON.stringify(responseJSON, null, 2)}\n`;
    
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(publicKeyGen);
    stellarAccountInfo.textContent += `\n🔍 Balances:\n`;
    account.balances.forEach((balance) => {
      stellarAccountInfo.textContent += `Asset: ${balance.asset_type}, Balance: ${balance.balance}\n`;
    });
    
    modoManual = true;
    connectedWallet = publicKeyGen;
    publicKey = publicKeyGen;
    try {
      localStorage.setItem('stellarSecret', secretKey);
      localStorage.setItem('stellarPublic', publicKeyGen);
      console.log('Se guardó stellarSecret en localStorage.');
    } catch(e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
    
    if (walletAddress) walletAddress.textContent = `Cuenta manual: ${publicKeyGen.substring(0, 10)}...${publicKeyGen.substring(publicKeyGen.length - 10)}`;
    if (walletStatus) {
      walletStatus.classList.remove('hidden');
      walletStatus.classList.add('bg-yellow-100', 'text-yellow-800');
    }
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.classList.remove('bg-gray-400');
      loginBtn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'hover:scale-105');
    }
    stellarAccountInfo.textContent += `\n\n⚠️ Nota: esta clave se generó localmente. Si deseas usarla en Freighter, importa la clave secreta manualmente.`;
  } catch (error) {
    stellarAccountInfo.textContent += `\n❌ Error: ${error}`;
  }
}

// Usar cuenta existente
async function usarCuentaExistente() {
  if (!stellarAccountInfo || !claveSecretaManualInput) return;
  const claveSecreta = claveSecretaManualInput.value.trim();
  stellarAccountInfo.textContent = "";
  const StellarSdk = window.StellarSdk;
  if (!claveSecreta.startsWith("S") || claveSecreta.length < 10) {
    stellarAccountInfo.textContent = "Clave secreta inválida.";
    return;
  }
  try {
    const pair = StellarSdk.Keypair.fromSecret(claveSecreta);
    ultimaClavePublica = pair.publicKey();
    ultimaClaveSecreta = claveSecreta;
    if (clavePublicaManualInput) clavePublicaManualInput.value = ultimaClavePublica;
    stellarAccountInfo.textContent = `Cuenta cargada:\nPublic Key: ${ultimaClavePublica}\n`;
    
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
    const account = await server.loadAccount(ultimaClavePublica);
    stellarAccountInfo.textContent += `\n🔍 Balances:\n`;
    account.balances.forEach((balance) => {
      stellarAccountInfo.textContent += `Asset: ${balance.asset_type}, Balance: ${balance.balance}\n`;
    });
    
    modoManual = true;
    connectedWallet = ultimaClavePublica;
    publicKey = ultimaClavePublica;
    try {
      localStorage.setItem('stellarSecret', claveSecreta);
      localStorage.setItem('stellarPublic', ultimaClavePublica);
    } catch(e) { console.warn('No se pudo guardar en localStorage', e); }
    
    if (walletAddress) walletAddress.textContent = `Cuenta manual: ${ultimaClavePublica.substring(0, 10)}...${ultimaClavePublica.substring(ultimaClavePublica.length - 10)}`;
    if (walletStatus) {
      walletStatus.classList.remove('hidden');
      walletStatus.classList.add('bg-yellow-100', 'text-yellow-800');
    }
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.classList.remove('bg-gray-400');
      loginBtn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'hover:scale-105');
    }
  } catch (error) {
    stellarAccountInfo.textContent = "Error al cargar la cuenta: " + error;
  }
}

// Ejecutar acciones del contrato
async function ejecutarAccion(accion) {
  const usernameEl = document.getElementById('username');
  const username = usernameEl ? usernameEl.value.trim() : 'usuario';
  if (!username) {
    alert('El nombre de usuario es obligatorio');
    return;
  }
  if (!connectedWallet) {
    alert('Por favor, conecta tu cuenta primero');
    return;
  }
  showResult(`Ejecutando acción: ${accion}...`, 'info');
  try {
    const simulatedResponse = {
      insert_user: `Usuario "${username}" insertado correctamente`,
      get_user: `Usuario encontrado: ${username}\nWallet: ${publicKey}`,
      edit_user: `Usuario "${username}" editado correctamente`,
      delete_user: `Usuario "${username}" eliminado correctamente`
    };
    await new Promise(resolve => setTimeout(resolve, 1500));
    showResult(`✓ ${simulatedResponse[accion]}`, 'success');
  } catch (error) {
    console.error('Error ejecutando acción:', error);
    showResult(`❌ Error: ${error.message}`, 'error');
  }
}

// Gestión de usuarios (register/login)
function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return buf2hex(hash);
}
function b64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
async function deriveKey(password, saltB64, iterations = 100000) {
  const saltBuf = b64ToArrayBuffer(saltB64);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), {name: 'PBKDF2'}, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {name: 'PBKDF2', salt: saltBuf, iterations: iterations, hash: 'SHA-256'},
    keyMaterial,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt','decrypt']
  );
}
async function decryptSecret(encryptedB64, saltB64, ivB64, password) {
  try {
    const key = await deriveKey(password, saltB64);
    const iv = new Uint8Array(b64ToArrayBuffer(ivB64));
    const cipherBuf = b64ToArrayBuffer(encryptedB64);
    const plainBuf = await crypto.subtle.decrypt({name: 'AES-GCM', iv: iv}, key, cipherBuf);
    const dec = new TextDecoder();
    return dec.decode(plainBuf);
  } catch (e) {
    throw new Error('No se pudo descifrar la clave secreta con la contraseña proporcionada.');
  }
}
function loadUsers() {
  try { return JSON.parse(localStorage.getItem('users') || '[]'); } catch (e) { return []; }
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Vincular elementos del DOM
  imageUploadDiv = document.getElementById('imageUpload');
  fileInput = imageUploadDiv ? imageUploadDiv.querySelector('input[type="file"]') : null;
  walletStatus = document.getElementById('walletStatus');
  walletAddress = document.getElementById('walletAddress');
  loginBtn = document.getElementById('loginBtn');
  loginForm = document.getElementById('loginForm');
  contractActions = document.getElementById('contractActions');
  result = document.getElementById('result');
  userRoleSelect = document.getElementById('userRole');
  crearCuentaBtn = document.getElementById('crearCuenta');
  usarCuentaExistenteBtn = document.getElementById('usarCuentaExistente');
  claveSecretaManualInput = document.getElementById('claveSecretaManual');
  clavePublicaManualInput = document.getElementById('clavePublicaManual');
  stellarAccountInfo = document.getElementById('stellarAccountInfo');

  // Evento: Crear y financiar cuenta
  if (crearCuentaBtn) {
    crearCuentaBtn.addEventListener('click', crearYFinanciarCuenta);
    console.log('✓ Evento "crearCuenta" attached');
  } else {
    console.warn('⚠️ Element #crearCuenta not found');
  }

  // Evento: Usar cuenta existente
  if (usarCuentaExistenteBtn) {
    usarCuentaExistenteBtn.addEventListener('click', usarCuentaExistente);
    console.log('✓ Evento "usarCuentaExistente" attached');
  }

  // Evento: Manejo de imagen
  if (imageUploadDiv && fileInput) {
    imageUploadDiv.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        const p = imageUploadDiv.querySelector('p');
        if (p) p.textContent = `✓ ${file.name}`;
        imageUploadDiv.classList.add('bg-green-50', 'border-green-400');
      }
    });
    imageUploadDiv.addEventListener('dragover', (event) => {
      event.preventDefault();
      imageUploadDiv.classList.add('bg-blue-100');
    });
    imageUploadDiv.addEventListener('dragleave', () => {
      imageUploadDiv.classList.remove('bg-blue-100');
    });
    imageUploadDiv.addEventListener('drop', (event) => {
      event.preventDefault();
      imageUploadDiv.classList.remove('bg-blue-100');
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        fileInput.files = event.dataTransfer.files;
        const p = imageUploadDiv.querySelector('p');
        if (p) p.textContent = `✓ ${file.name}`;
        imageUploadDiv.classList.add('bg-green-50', 'border-green-400');
      }
    });
  }

  // Evento: Formulario de login
  if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      const usernameEl = document.getElementById('username');
      const loginPasswordEl = document.getElementById('loginPassword');
      const username = usernameEl ? usernameEl.value.trim() : '';
      const passwordInput = loginPasswordEl ? loginPasswordEl.value : '';
      const selectedRole = userRoleSelect ? userRoleSelect.value : '';

      if (!selectedRole) {
        alert('Por favor, selecciona tu rol (Maestro o Alumno).');
        return;
      }

      if (!username) {
        alert('Por favor, ingresa tu nombre de usuario o email.');
        return;
      }

      if (!passwordInput) {
        alert('Contraseña requerida para iniciar sesión.');
        return;
      }

      const users = loadUsers();
      const hashed = await hashPassword(passwordInput);
      const found = users.find(u => (u.username === username || u.email === username) && u.passwordHash === hashed);
      
      if (!found) {
        alert('Usuario no encontrado o contraseña incorrecta. Por favor, regístrate primero.');
        window.location.href = 'Register.html';
        return;
      }

      if (found.encryptedSecret && found.encSalt && found.encIv) {
        try {
          const secret = await decryptSecret(found.encryptedSecret, found.encSalt, found.encIv, passwordInput);
          ultimaClaveSecreta = secret;
          ultimaClavePublica = found.stellarPublic || null;
          modoManual = true;
          connectedWallet = ultimaClavePublica;
          publicKey = ultimaClavePublica;
          try {
            if (walletAddress) walletAddress.textContent = `Cuenta manual: ${ultimaClavePublica.substring(0,10)}...${ultimaClavePublica.substring(ultimaClavePublica.length-10)}`;
            if (walletStatus) {
              walletStatus.classList.remove('hidden');
              walletStatus.classList.add('bg-yellow-100', 'text-yellow-800');
            }
          } catch(e){}
        } catch (decErr) {
          alert(decErr.message);
          return;
        }
      }

      if (!connectedWallet && !ultimaClavePublica) {
        const ok = confirm('No hay cuenta Stellar conectada. ¿Deseas continuar sin wallet?');
        if (!ok) return;
      }

      if (ultimaClavePublica) localStorage.setItem('stellarPublic', ultimaClavePublica);
      localStorage.setItem('userRole', selectedRole);

      showResult(`✓ Autenticación exitosa para ${username}\nRol: ${selectedRole}\nCuenta: ${connectedWallet || ultimaClavePublica || 'N/A'}`, 'success');
      
      setTimeout(() => { 
        if (selectedRole === 'maestro') {
          window.location.href = './Maestro.html';
        } else if (selectedRole === 'alumno') {
          window.location.href = './Inicio.html';
        } else {
          alert('Error: Rol no reconocido');
        }
      }, 500);
    });
  }

  // Eventos: Botones de acciones del contrato
  const getUserBtn = document.getElementById('getUserBtn');
  const editUserBtn = document.getElementById('editUserBtn');
  const deleteUserBtn = document.getElementById('deleteUserBtn');
  const insertUserBtn = document.getElementById('insertUserBtn');
  if (getUserBtn) getUserBtn.addEventListener('click', () => ejecutarAccion('get_user'));
  if (editUserBtn) editUserBtn.addEventListener('click', () => ejecutarAccion('edit_user'));
  if (deleteUserBtn) deleteUserBtn.addEventListener('click', () => ejecutarAccion('delete_user'));
  if (insertUserBtn) insertUserBtn.addEventListener('click', () => ejecutarAccion('insert_user'));

  // Al cargar la página, cargar estado previo de Stellar
  window.addEventListener('load', () => {
    const publicKeyStored = localStorage.getItem('stellarPublic');
    if (publicKeyStored && walletStatus && walletAddress) {
      walletStatus.classList.remove('hidden');
      walletStatus.classList.add('bg-blue-50', 'text-blue-800');
      walletAddress.textContent = `Cuenta pública (protegida): ${publicKeyStored.substring(0,10)}...${publicKeyStored.substring(publicKeyStored.length - 10)}`;
    }
  });

  console.log('✓ app.js loaded and ready');
});