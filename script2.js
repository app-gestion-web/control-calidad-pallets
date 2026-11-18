document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("muestras-body-p2");

    // 1. Generar automáticamente las 20 filas de la Página 2
    if (tbody) {
        for (let i = 1; i <= 20; i++) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="col-num">${i}</td>
                <td><input type="number" step="0.1" min="0" class="calc-col" data-col="0"></td>
                <td><input type="number" step="0.1" min="0" class="calc-col" data-col="1"></td>
                <td><input type="number" step="0.1" min="0" class="calc-col" data-col="2"></td>
                <td><input type="number" step="0.1" min="0" class="calc-col" data-col="3"></td>
                <td><input type="number" step="0.1" min="0" class="calc-col" data-col="4"></td>
                <td><input type="checkbox" class="chk-si" data-row="${i}"></td>
                <td><input type="checkbox" class="chk-no" data-row="${i}"></td>
                <td><input type="text" style="text-align: left; padding-left: 4px;"></td>
            `;
            tbody.appendChild(tr);
        }
    }

    // 2. Bloquear teclas 'e', 'E', '+' y '-' en los campos numéricos de la Página 2
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (["e", "E", "+", "-"].includes(e.key)) {
                e.preventDefault();
            }
        });
    });

    // 3. Calcular promedios en tiempo real (Humedad y Dimensiones Generales)
    const inputsNum = document.querySelectorAll(".calc-col");
    const idsProm = ["prom-ch-taco", "prom-ch-tablilla", "prom-espesor", "prom-ancho", "prom-largo"];

    inputsNum.forEach(input => {
        input.addEventListener("input", () => {
            const colIndex = input.getAttribute("data-col");
            const colInputs = document.querySelectorAll(`.calc-col[data-col="${colIndex}"]`);
            let suma = 0, contador = 0;

            colInputs.forEach(item => {
                const val = parseFloat(item.value);
                if (!isNaN(val)) {
                    suma += val;
                    contador++;
                }
            });

            const promedio = contador > 0 ? (suma / contador).toFixed(1) : "0.0";
            document.getElementById(idsProm[colIndex]).textContent = promedio;
        });
    });

    // 4. Control exclusivo de casillas SI / NO y conteo automático
    document.addEventListener("change", (e) => {
        if (e.target.classList.contains("chk-si") || e.target.classList.contains("chk-no")) {
            const row = e.target.getAttribute("data-row");
            const chkSi = document.querySelector(`.chk-si[data-row="${row}"]`);
            const chkNo = document.querySelector(`.chk-no[data-row="${row}"]`);

            if (e.target.classList.contains("chk-si") && chkSi.checked) chkNo.checked = false;
            if (e.target.classList.contains("chk-no") && chkNo.checked) chkSi.checked = false;

            document.getElementById("total-si").textContent = document.querySelectorAll(".chk-si:checked").length;
            document.getElementById("total-no").textContent = document.querySelectorAll(".chk-no:checked").length;
        }
    });

    // 5. SISTEMA DE BASE DE DATOS ACUMULADA EN MEMORIA
    const CLAVE_BD = "bd_control_calidad_pallets";
    const spanContador = document.getElementById("contador-bd");

    function actualizarContadorBD() {
        const historial = JSON.parse(localStorage.getItem(CLAVE_BD)) || [];
        if (spanContador) spanContador.textContent = historial.length;
    }
    actualizarContadorBD();

    // Botón A: Guardar registro actual en el historial acumulado
    const btnAgregarBD = document.getElementById("btn-agregar-bd");
    if (btnAgregarBD) {
        btnAgregarBD.addEventListener("click", () => {
            const ot = document.getElementById("ot-p2").value.trim();
            if (!ot) {
                alert("⚠️ Por favor ingresa al menos el número de OT antes de guardar en la base de datos.");
                return;
            }

            const nuevoRegistro = [
                document.getElementById("fecha-p2").value || "",
                ot,
                document.getElementById("cliente-p2").value || "",
                document.getElementById("evaluador-p2").value || "",
                document.getElementById("producto-p2").value || "",
                document.getElementById("especie-p2").value || "",
                document.getElementById("codigo-p2").value || "",
                document.getElementById("prom-ch-taco").textContent,
                document.getElementById("prom-ch-tablilla").textContent,
                document.getElementById("prom-espesor").textContent,
                document.getElementById("prom-ancho").textContent,
                document.getElementById("prom-largo").textContent,
                document.getElementById("total-si").textContent,
                document.getElementById("total-no").textContent
            ];

            const historial = JSON.parse(localStorage.getItem(CLAVE_BD)) || [];
            historial.push(nuevoRegistro);
            localStorage.setItem(CLAVE_BD, JSON.stringify(historial));

            actualizarContadorBD();
            alert(`✅ Registro de la OT ${ot} guardado en la base de datos.\nTotal acumulado: ${historial.length} registros.`);
        });
    }

    // Botón B: Descargar todo el historial acumulado en un archivo Excel (CSV)
    const btnExcel = document.getElementById("btn-excel-p2");
    if (btnExcel) {
        btnExcel.addEventListener("click", () => {
            const historial = JSON.parse(localStorage.getItem(CLAVE_BD)) || [];

            if (historial.length === 0) {
                alert("⚠️ La base de datos está vacía. Primero presiona 'Guardar en Base de Datos' para acumular registros.");
                return;
            }

            const encabezados = [
                "FECHA", "OT", "CLIENTE", "EVALUADOR", "PRODUCTO", "ESPECIE", "CODIGO DE PROD.",
                "% CH TACO (PROM)", "% CH TABLILLA (PROM)", "ESPESOR mm (PROM)",
                "ANCHO mm (PROM)", "LARGO mm (PROM)", "CONFORME SI", "CONFORME NO"
            ];

            const filasCSV = historial.map(fila =>
                fila.map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(";")
            );

            const contenidoFinal = "\uFEFF" + encabezados.join(";") + "\n" + filasCSV.join("\n");

            const blob = new Blob([contenidoFinal], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement("a");
            const fechaHoy = new Date().toISOString().slice(0, 10);

            enlace.href = url;
            enlace.setAttribute("download", `Base_Datos_Calidad_Pallets_${fechaHoy}.csv`);
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);
        });
    }

    // 6. Botón Guardar Ficha Completa (2 páginas) en PDF
    const btnPdf = document.getElementById("btn-pdf-p2");
    if (btnPdf) {
        btnPdf.addEventListener("click", () => window.print());
    }

    // 7. Botón Borrar Ficha (Limpia AMBAS hojas sin borrar la Base de Datos)
    const btnLimpiar = document.getElementById("btn-limpiar-p2");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            if (confirm("¿Deseas limpiar todos los campos de ambas hojas para iniciar una nueva evaluación? (Tu base de datos acumulada se mantendrá a salvo)")) {
                document.querySelectorAll("input[type='text'], input[type='number'], input[type='date'], textarea").forEach(el => el.value = "");
                document.querySelectorAll("input[type='checkbox']").forEach(el => el.checked = false);
                idsProm.forEach(id => document.getElementById(id).textContent = "0.0");
                document.getElementById("total-si").textContent = "0";
                document.getElementById("total-no").textContent = "0";
            }
        });
    }

    // 8. Botón para Vaciar el Historial de la Base de Datos
    const btnVaciarBD = document.getElementById("btn-vaciar-bd");
    if (btnVaciarBD) {
        btnVaciarBD.addEventListener("click", () => {
            const historial = JSON.parse(localStorage.getItem(CLAVE_BD)) || [];

            if (historial.length === 0) {
                alert("ℹ️ El historial de la base de datos ya está vacío.");
                return;
            }

            // Doble verificación de seguridad para evitar pérdidas de datos
            const confirmar = confirm(`⚠️ ADVERTENCIA: Estás a punto de borrar ${historial.length} registros acumulados en la base de datos.\n\n¿Ya descargaste tu archivo Excel antes de borrarlos?`);

            if (confirmar) {
                localStorage.removeItem(CLAVE_BD);
                actualizarContadorBD();
                alert("✅ El historial de la base de datos ha sido vaciado por completo (0 registros).");
            }
        });
    }
});


