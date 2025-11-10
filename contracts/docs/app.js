// Variables del contrato
const CONTRACT_ID = 'CDS3VGIAZFIZUG3GL6LWAXLOXWCRIIBDPPRS4225LLLEHPGTFDNF4PQK';
// Usar endpoints y passphrase consistentes con Testnet público
// Horizon público Testnet (para consultar cuentas y enviar transacciones)
const RPC_URL = 'https://horizon-testnet.stellar.org';
// Para operaciones Soroban en Testnet público puedes usar el RPC de Soroban Testnet
const SOROBAN_RPC_URL = 'https://rpc-testnet.stellar.org';

// Variables globales para Freighter
let connectedWallet = null;
let publicKey = null;
// Passphrase oficial de la Testnet pública
let networkPassphrase = StellarSdk.Networks.TESTNET;

// Elementos del DOM
const form = document.getElementById('userForm');
const nameEl = document.getElementById('name');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const result = document.getElementById('result');
const clavePublicaManualInput = document.getElementById('clavePublicaManual');

// Verificar si Freighter está instalado
function isFreighterAvailable() {
  return typeof window.freighterApi !== 'undefined';
}

// Conectar con Freighter Wallet
async function connectFreighterWallet() {
  if (!isFreighterAvailable()) {
    alert('Freighter wallet no está instalado. Por favor, instálalo desde https://freighter.app/');
    return false;
  }

  try {
    // Verificar si ya tiene permisos
    const isAllowed = await window.freighterApi.isAllowed();
    
    if (!isAllowed) {
      // Solicitar permisos
      await window.freighterApi.setAllowed();
    }

    // Obtener la clave pública
    publicKey = await window.freighterApi.getPublicKey();
    connectedWallet = publicKey;

    console.log('Wallet conectada:', publicKey);
    updateWalletStatus(true);
    return true;
    
  } catch (error) {
    console.error('Error conectando con Freighter:', error);
    result.textContent = `❌ Error conectando wallet: ${error.message}`;
    return false;
  }
}

// Actualizar estado de la wallet en la UI
function updateWalletStatus(connected) {
  const walletBtn = document.getElementById('connectWalletBtn');
  const walletStatus = document.getElementById('walletStatus');
  
  if (connected && connectedWallet) {
    if (walletBtn) {
      walletBtn.textContent = '✓ Wallet Conectada';
      walletBtn.classList.add('bg-green-500', 'text-white');
      walletBtn.disabled = true;
    }
    
    if (walletStatus) {
      walletStatus.textContent = `Conectado: ${publicKey.substring(0, 10)}...${publicKey.substring(publicKey.length - 10)}`;
      walletStatus.classList.remove('hidden');
    }
  }
}

// Firmar transacción con Freighter
async function signTransactionWithFreighter(transaction) {
  if (!connectedWallet) {
    throw new Error('Wallet no conectada');
  }

  try {
    const signedTransaction = await window.freighterApi.signTransaction(transaction, {
      network: networkPassphrase,
      accountToSign: publicKey,
    });
    
    return signedTransaction;
  } catch (error) {
    console.error('Error firmando transacción:', error);
    throw error;
  }
}

// Ejecutar acciones del contrato con Freighter
async function ejecutarAccion(accion) {
  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();

  if (!name) {
    alert('El nombre es obligatorio');
    return;
  }

  if (!connectedWallet) {
    alert('Por favor, conecta tu wallet Freighter primero');
    return;
  }

  result.textContent = `Ejecutando acción: ${accion} con wallet...`;

  try {
    // Crear servidor de Stellar
    const server = new StellarSdk.Server(RPC_URL);
    
    // Obtener cuenta: si no existe, ofrecer financiarla (friendbot) en Testnet
    let account;
    try {
      account = await server.loadAccount(publicKey);
    } catch (err) {
      // Detectar account missing / 404 de Horizon
      const notFound = (err && (err.status === 404 || (err.response && err.response.status === 404))) || (err && err.message && err.message.toLowerCase().includes('resource missing'));
      if (notFound) {
        const wantFund = confirm('La cuenta no existe o no está activa en Testnet. ¿Deseas financiarla ahora con friendbot?');
        if (wantFund) {
          try {
            const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
            const json = await res.json();
            console.log('Friendbot respuesta:', json);
            // Reintentar cargar la cuenta
            await new Promise(r => setTimeout(r, 1000));
            account = await server.loadAccount(publicKey);
          } catch (fbErr) {
            throw new Error('No se pudo financiar la cuenta con friendbot: ' + (fbErr.message || fbErr));
          }
        } else {
          throw new Error('Cuenta no activa en Testnet. Operación cancelada por el usuario.');
        }
      } else {
        throw err;
      }
    }
    
    // Construir transacción (ejemplo genérico)
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase,
    });

    // Aquí agregarías las operaciones específicas del contrato Soroban
    // Ejemplo de invocación de contrato:
    /*
    const contractOperation = StellarSdk.Operation.invokeHostFunction({
      hostFunction: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
        new StellarSdk.xdr.InvokeContractArgs({
          contractAddress: StellarSdk.StrKey.encodeContract(CONTRACT_ID),
          functionName: accion,
          args: [
            StellarSdk.xdr.ScVal.scvString(name),
            StellarSdk.xdr.ScVal.scvString(email),
            StellarSdk.xdr.ScVal.scvString(password)
          ]
        })
      ),
      source: publicKey,
    });
    
    transaction.addOperation(contractOperation);
    */

  // Por ahora, simulamos la transacción (si decides crear operaciones reales, usa esta plantilla)
  const builtTransaction = transaction.setTimeout(30).build();

  // Firmar con Freighter: Freighter espera XDR en base64 o el objeto de transacción según su API
  const signedXdr = await signTransactionWithFreighter(builtTransaction.toXDR());

  // Convertir XDR firmado a Transaction y enviar a Horizon
  const transactionFromXDR = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const response = await server.submitTransaction(transactionFromXDR);
    
    // Mostrar resultado
    result.textContent = `✓ Transacción exitosa!\nHash: ${response.hash}\nAcción: ${accion}\nNombre: ${name}\nWallet: ${publicKey}`;

  } catch (error) {
    console.error('Error ejecutando acción:', error);
    
    // Manejo de errores específicos
    if (error.message.includes('User declined access')) {
      result.textContent = '❌ Usuario canceló la transacción en Freighter';
    } else if (error.message.includes('Wallet not connected')) {
      result.textContent = '❌ Wallet no conectada';
    } else {
      result.textContent = `❌ Error: ${error.message}`;
    }
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si Freighter está disponible al cargar la página
  if (!isFreighterAvailable()) {
    result.textContent = '⚠️ Freighter wallet no detectada. Por favor, instálala desde https://freighter.app/';
  }

  // Botón para conectar wallet (si existe en tu HTML)
  const connectBtn = document.getElementById('connectWalletBtn');
  if (connectBtn) {
    connectBtn.addEventListener('click', connectFreighterWallet);
  }

  // Formulario principal
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Conectar wallet si no está conectada
      if (!connectedWallet) {
        const connected = await connectFreighterWallet();
        if (!connected) {
          return;
        }
      }
      
      // Ejecutar inserción de usuario
      ejecutarAccion('insert_user');
    });
  }

  // Botones adicionales
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const getBtn = document.getElementById('getBtn');

  if (editBtn) editBtn.onclick = () => ejecutarAccion('edit_user');
  if (deleteBtn) deleteBtn.onclick = () => ejecutarAccion('delete_user');
  if (getBtn) getBtn.onclick = () => ejecutarAccion('get_user');
});

// Funciones auxiliares para Soroban 

// Convertir valores a XDR para Soroban
function toScVal(value, type = 'string') {
  switch (type) {
    case 'string':
      return StellarSdk.xdr.ScVal.scvString(value);
    case 'number':
      return StellarSdk.xdr.ScVal.scvI64(StellarSdk.xdr.Int64.fromString(value.toString()));
    case 'boolean':
      return StellarSdk.xdr.ScVal.scvBool(value);
    default:
      return StellarSdk.xdr.ScVal.scvString(value);
  }
}

// Función para crear operación de contrato Soroban
function createContractOperation(functionName, args = []) {
  return StellarSdk.Operation.invokeHostFunction({
    hostFunction: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
      new StellarSdk.xdr.InvokeContractArgs({
        contractAddress: StellarSdk.StrKey.encodeContract(CONTRACT_ID),
        functionName: functionName,
        args: args
      })
    ),
    source: publicKey,
  });
}

// Exportar funciones si se usa como módulo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    connectFreighterWallet,
    ejecutarAccion,
    isFreighterAvailable,
    CONTRACT_ID,
    RPC_URL
  };
}

ultimaClavePublica = pair.publicKey();
clavePublicaManualInput.value = ultimaClavePublica;