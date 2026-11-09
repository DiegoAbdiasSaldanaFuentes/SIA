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