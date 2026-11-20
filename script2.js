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

    function mostrarModal({ titulo, mensaje, icono = "ℹ️", esConfirmacion = false, colorBoton = "#2563eb" }) {
        return new Promise((resolve) => {
            const overlay = document.getElementById("custom-modal");
            const elIcono = document.getElementById("modal-icon");
            const elTitulo = document.getElementById("modal-title");
            const elMensaje = document.getElementById("modal-message");
            const btnOk = document.getElementById("modal-btn-ok");
            const btnCancel = document.getElementById("modal-btn-cancel");

            elIcono.textContent = icono;
            elTitulo.textContent = titulo;
            elMensaje.textContent = mensaje;
            btnOk.style.backgroundColor = colorBoton;

            btnCancel.style.display = esConfirmacion ? "block" : "none";
            btnOk.textContent = esConfirmacion ? "Sí, continuar" : "Entendido";

            overlay.classList.add("activo");

            const cerrar = (resultado) => {
                overlay.classList.remove("activo");
                btnOk.onclick = null;
                btnCancel.onclick = null;
                resolve(resultado);
            };

            btnOk.onclick = () => cerrar(true);
            btnCancel.onclick = () => cerrar(false);
        });
    }

    // Botón A: Guardar registro actual en el historial acumulado
    const btnAgregarBD = document.getElementById("btn-agregar-bd");
    if (btnAgregarBD) {
        btnAgregarBD.addEventListener("click", async () => {
            const ot = document.getElementById("ot-p2").value.trim();
            if (!ot) {
                await mostrarModal({
                    icono: "⚠️",
                    titulo: "Falta número de OT",
                    mensaje: "Por favor ingresa el número de Orden de Trabajo (OT) antes de guardar en la base de datos.",
                    colorBoton: "#d97706"
                });
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
            await mostrarModal({
                icono: "✅",
                titulo: "Registro Guardado",
                mensaje: `La evaluación de la OT ${ot} se añadió correctamente.\nTotal acumulado en historial: ${historial.length} registros.`,
                colorBoton: "#16a34a"
            });
        });
    }

    // Botón B: Descargar todo el historial en un archivo Excel (.xlsx)
    const btnExcel = document.getElementById("btn-excel-p2");
    if (btnExcel) {
        btnExcel.addEventListener("click", async () => {
            const historial = JSON.parse(localStorage.getItem(CLAVE_BD)) || [];

            if (historial.length === 0) {
                await mostrarModal({
                    icono: "📂",
                    titulo: "Base de Datos Vacía",
                    mensaje: "Aún no hay registros guardados. Presiona primero 'Guardar en BD' para acumular evaluaciones.",
                    colorBoton: "#d97706"
                });
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Base de Datos Calidad");

            worksheet.columns = [
                { header: "FECHA", key: "fecha", width: 14 },
                { header: "OT", key: "ot", width: 10 },
                { header: "CLIENTE", key: "cliente", width: 22 },
                { header: "EVALUADOR", key: "evaluador", width: 20 },
                { header: "PRODUCTO", key: "producto", width: 16 },
                { header: "ESPECIE", key: "especie", width: 15 },
                { header: "CÓDIGO DE PROD.", key: "codigo", width: 18 },
                { header: "% CH TACO\n(PROM)", key: "chTaco", width: 15 },
                { header: "% CH TABLILLA\n(PROM)", key: "chTab", width: 16 },
                { header: "ESPESOR mm\n(PROM)", key: "espesor", width: 15 },
                { header: "ANCHO mm\n(PROM)", key: "ancho", width: 15 },
                { header: "LARGO mm\n(PROM)", key: "largo", width: 15 },
                { header: "CONFORME\nSI", key: "si", width: 13 },
                { header: "CONFORME\nNO", key: "no", width: 13 }
            ];

            const filaEncabezado = worksheet.getRow(1);
            filaEncabezado.height = 30;
            filaEncabezado.eachCell((cell) => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
                cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF000000" } };
                cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
                cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
            });

            historial.forEach((registro) => {
                const nuevaFila = worksheet.addRow(registro);
                nuevaFila.height = 20;
                nuevaFila.eachCell((cell, colNumber) => {
                    cell.font = { name: "Arial", size: 9 };
                    cell.alignment = { vertical: "middle", horizontal: (colNumber >= 3 && colNumber <= 6) ? "left" : "center" };
                    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement("a");
            const fechaHoy = new Date().toISOString().slice(0, 10);

            enlace.href = url;
            enlace.setAttribute("download", `Base_Datos_Calidad_Pallets_${fechaHoy}.xlsx`);
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);
        });
    }

    // 7. Botón Borrar Ficha (Limpia AMBAS hojas sin borrar la Base de Datos)
    const btnLimpiar = document.getElementById("btn-limpiar-p2");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", async () => {
            const confirmado = await mostrarModal({
                icono: "🗑️",
                titulo: "¿Limpiar Ficha Actual?",
                mensaje: "Se borrarán los datos escritos en ambas hojas para iniciar una nueva.\n(Tu historial de base de datos no se verá afectado).",
                esConfirmacion: true,
                colorBoton: "#ef4444"
            });

            if (confirmado) {
                document.querySelectorAll("input[type='text'], input[type='number'], input[type='date'], textarea").forEach(el => el.value = "");
                document.querySelectorAll("input[type='checkbox']").forEach(el => el.checked = false);
                idsProm.forEach(id => document.getElementById(id).textContent = "0.0");
                document.getElementById("total-si").textContent = "0";
                document.getElementById("total-no").textContent = "0";
            }
        });
    }

    // 6. Botón Guardar Ficha Completa (2 páginas) en PDF
    const btnPdf = document.getElementById("btn-pdf-p2");
    if (btnPdf) {
        btnPdf.addEventListener("click", () => window.print());
    }

    // 8. Botón para Vaciar el Historial de la Base de Datos
    const btnVaciarBD = document.getElementById("btn-vaciar-bd");
    if (btnVaciarBD) {
        btnVaciarBD.addEventListener("click", async () => {
            const historial = JSON.parse(localStorage.getItem(CLAVE_BD)) || [];
            if (historial.length === 0) {
                await mostrarModal({
                    icono: "ℹ️",
                    titulo: "Historial Vacío",
                    mensaje: "No hay registros acumulados para borrar en este momento.",
                    colorBoton: "#475569"
                });
                return;
            }

            const confirmado = await mostrarModal({
                icono: "🚨",
                titulo: "¿Vaciar Base de Datos?",
                mensaje: `Estás a punto de eliminar ${historial.length} registros guardados.\nAsegúrate de haber descargado el Excel antes de continuar.`,
                esConfirmacion: true,
                colorBoton: "#dc2626"
            });

            if (confirmado) {
                localStorage.removeItem(CLAVE_BD);
                actualizarContadorBD();
                await mostrarModal({
                    icono: "🧹",
                    titulo: "Historial Vaciado",
                    mensaje: "La base de datos ha vuelto a 0 registros.",
                    colorBoton: "#16a34a"
                });
            }
        });
    }


    // 9. Lógica para abrir y cerrar el menú flotante de opciones
    const btnToggleFab = document.getElementById("btn-fab-toggle");
    const fabMenu = document.getElementById("fab-menu");

    if (btnToggleFab && fabMenu) {
        btnToggleFab.addEventListener("click", (e) => {
            e.stopPropagation(); // Evita que el clic cierre el menú al instante
            fabMenu.classList.toggle("activo");
            btnToggleFab.textContent = fabMenu.classList.contains("activo") ? "✖️ Cerrar" : "⚙️ Opciones";
        });

        // Cierra el menú automáticamente si el usuario toca cualquier otra parte de la hoja
        document.addEventListener("click", (e) => {
            if (!fabMenu.contains(e.target) && e.target !== btnToggleFab) {
                fabMenu.classList.remove("activo");
                btnToggleFab.textContent = "⚙️ Opciones";
            }
        });
    }

});


