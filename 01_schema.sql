CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo_barras VARCHAR(13) UNIQUE NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5
);
CREATE TABLE IF NOT EXISTS historial_movimientos (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);