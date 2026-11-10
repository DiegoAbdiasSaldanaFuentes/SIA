import { useState, useRef, useEffect } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import './App.css'

// Dirección del webhook de n8n (la define el líder en el backend)
const WEBHOOK_URL = 'http://localhost:5678/webhook/scan'

// Id del <div> donde html5-qrcode dibuja el video de la cámara
const ID_LECTOR = 'lector'

function App() {
  // ---------- Estado de la pantalla ----------
  const [tipo, setTipo] = useState('salida') // 'entrada' o 'salida'
  const [cantidad, setCantidad] = useState(1)
  const [escaneando, setEscaneando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { clase, texto }
  const [ultimo, setUltimo] = useState(null) // datos del último envío exitoso

  // ---------- Referencias (valores que no provocan re-render) ----------
  const scannerRef = useRef(null)
  const procesandoRef = useRef(false)
  // El callback del escáner se crea una sola vez al iniciar la cámara,
  // por eso guardamos aquí los valores más recientes de tipo y cantidad.
  const tipoRef = useRef(tipo)
  const cantidadRef = useRef(cantidad)

  useEffect(() => {
    tipoRef.current = tipo
    cantidadRef.current = cantidad
  }, [tipo, cantidad])

  // Al cerrar la pantalla, apagamos la cámara si quedó encendida
  useEffect(() => {
    return () => {
      detenerCamara()
    }
  }, [])

  // ---------- Funciones de la cámara ----------
  async function detenerCamara() {
    const scanner = scannerRef.current
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop()
        scanner.clear()
      } catch (error) {
        console.error('Error al detener la cámara:', error)
      }
      scannerRef.current = null
    }
    setEscaneando(false)
  }

  async function iniciarCamara() {
    setMensaje(null)
    procesandoRef.current = false

    try {
      const scanner = new Html5Qrcode(ID_LECTOR, {
        // Solo leemos EAN-13 (códigos de barra de productos)
        formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
        verbose: false,
      })
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' }, // cámara trasera del celular
        { fps: 10, qrbox: { width: 280, height: 140 } },
        alLeerCodigo,
        () => {} // errores de "no se encontró código" en cada frame: se ignoran
      )
      setEscaneando(true)
    } catch (error) {
      console.error(error)
      scannerRef.current = null
      setMensaje({
        clase: 'error',
        texto: 'No se pudo abrir la cámara. Revisa los permisos del navegador.',
      })
    }
  }

  // Se ejecuta cada vez que la cámara detecta un código
  async function alLeerCodigo(codigo) {
    if (procesandoRef.current) return // ya estamos enviando uno
    procesandoRef.current = true

    // Vibración corta como confirmación (solo en celulares compatibles)
    if (navigator.vibrate) navigator.vibrate(100)

    await detenerCamara() // apagamos la cámara para no leer el mismo código en bucle
    await enviarAlWebhook(codigo)
  }

  // ---------- Envío al webhook de n8n ----------
  async function enviarAlWebhook(codigo) {
    // Contrato JSON acordado con el backend
    const datos = {
      codigo_barras: codigo,
      operacion: tipoRef.current === 'entrada' ? 'suma' : 'resta',
      cantidad: cantidadRef.current,
    }

    setEnviando(true)
    setMensaje({ clase: 'info', texto: `Enviando ${codigo}...` })

    try {
      const respuesta = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })

      if (!respuesta.ok) {
        throw new Error(`El servidor respondió con estado ${respuesta.status}`)
      }

      setMensaje({ clase: 'ok', texto: '✅ Enviado correctamente' })
      setUltimo({
        ...datos,
        hora: new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      })
    } catch (error) {
      console.error(error)
      setMensaje({
        clase: 'error',
        texto: '❌ No se pudo enviar. ¿Está n8n encendido y escuchando?',
      })
    } finally {
      setEnviando(false)
    }
  }

  // ---------- Cantidad ----------
  function cambiarCantidad(valor) {
    const numero = parseInt(valor, 10)
    setCantidad(Number.isNaN(numero) || numero < 1 ? 1 : numero)
  }

  // ---------- Pantalla ----------
  const esEntrada = tipo === 'entrada'
  const bloqueado = escaneando || enviando

  return (
    <main className="app">
      <header className="cabecera">
        <h1>Escáner de inventario</h1>
        <p>Minimarket · Control de stock</p>
      </header>

      {/* Banner del modo activo */}
      <div className={`banner ${esEntrada ? 'entrada' : 'salida'}`}>
        {esEntrada ? '＋ MODO ENTRADA' : '－ MODO SALIDA'}
      </div>

      {/* Selector Entrada (+) / Salida (-) */}
      <div className="selector">
        <button
          className={esEntrada ? 'activo entrada' : ''}
          onClick={() => setTipo('entrada')}
          disabled={bloqueado}
        >
          Entrada (+)
        </button>
        <button
          className={!esEntrada ? 'activo salida' : ''}
          onClick={() => setTipo('salida')}
          disabled={bloqueado}
        >
          Salida (-)
        </button>
      </div>

      {/* Cantidad */}
      <div className="cantidad">
        <label htmlFor="cantidad">Cantidad por escaneo</label>
        <div className="cantidad-controles">
          <button onClick={() => cambiarCantidad(cantidad - 1)} disabled={bloqueado}>
            −
          </button>
          <input
            id="cantidad"
            type="number"
            inputMode="numeric"
            min="1"
            value={cantidad}
            onChange={(e) => cambiarCantidad(e.target.value)}
            disabled={bloqueado}
          />
          <button onClick={() => cambiarCantidad(cantidad + 1)} disabled={bloqueado}>
            +
          </button>
        </div>
      </div>

      {/* Visor de la cámara */}
      <div className={`visor ${escaneando ? 'encendido' : ''}`}>
        {!escaneando && (
          <div className="visor-vacio">
            <span className="icono">📷</span>
            <span>Cámara apagada</span>
          </div>
        )}
        <div id={ID_LECTOR} className="lector"></div>
      </div>

      {/* Botón principal */}
      {escaneando ? (
        <button className="principal detener" onClick={detenerCamara}>
          Detener cámara
        </button>
      ) : (
        <button className="principal" onClick={iniciarCamara} disabled={enviando}>
          {ultimo ? 'Escanear siguiente' : 'Escanear código'}
        </button>
      )}

      {/* Mensaje de estado */}
      {mensaje && <p className={`mensaje ${mensaje.clase}`}>{mensaje.texto}</p>}

      {/* Último escaneo enviado */}
      {ultimo && (
        <section className="ultimo">
          <h2>Último escaneo</h2>
          <dl>
            <div>
              <dt>Código</dt>
              <dd>{ultimo.codigo_barras}</dd>
            </div>
            <div>
              <dt>Operación</dt>
              <dd>{ultimo.operacion === 'suma' ? 'Entrada (+)' : 'Salida (-)'}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>{ultimo.cantidad}</dd>
            </div>
            <div>
              <dt>Hora</dt>
              <dd>{ultimo.hora}</dd>
            </div>
          </dl>
        </section>
      )}
    </main>
  )
}

export default App