-- 1. Sumar stock (Reabastecimiento de mercadería)
-- Parámetros en n8n: $1 = cantidad a sumar, $2 = codigo_barras
UPDATE productos
SET stock_actual = stock_actual + $1
WHERE codigo_barras = $2
RETURNING id, nombre, codigo_barras, stock_actual, stock_minimo;

-- 2. Restar stock (Salida por venta en piso)
-- Parámetros en n8n: $1 = cantidad a restar, $2 = codigo_barras
UPDATE productos
SET stock_actual = stock_actual - $1
WHERE codigo_barras = $2
RETURNING id, nombre, codigo_barras, stock_actual, stock_minimo;

-- 3. Consultar productos con stock crítico (stock_actual <= stock_minimo)
SELECT id, nombre, codigo_barras, stock_actual, stock_minimo
FROM productos
WHERE stock_actual <= stock_minimo
ORDER BY stock_actual ASC;

-- 4. Registrar un movimiento en el historial (usando el codigo_barras)
-- Parámetros en n8n: $1 = codigo_barras, $2 = 'ENTRADA' o 'SALIDA', $3 = cantidad
INSERT INTO historial_movimientos (producto_id, tipo_movimiento, cantidad)
SELECT id, $2, $3
FROM productos
WHERE codigo_barras = $1
RETURNING id, producto_id, tipo_movimiento, cantidad, fecha;

-- 5. Consultar el historial de movimientos con el nombre del producto
SELECT h.id, p.nombre, p.codigo_barras, h.tipo_movimiento, h.cantidad, h.fecha
FROM historial_movimientos h
JOIN productos p ON h.producto_id = p.id
ORDER BY h.fecha DESC;