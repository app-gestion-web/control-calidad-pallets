document.addEventListener("DOMContentLoaded", () => {

    // 1. Generar las 20 filas de la matriz superior (Página 1)
    const tbody = document.getElementById("muestras-body");
    const totalMuestras = 20;
    const totalColumnasDatos = 24;

    if (tbody) {
        for (let i = 1; i <= totalMuestras; i++) {
            const fila = document.createElement("tr");

            const celdaNumero = document.createElement("td");
            celdaNumero.textContent = i;
            celdaNumero.classList.add("col-num");
            fila.appendChild(celdaNumero);

            for (let j = 1; j <= totalColumnasDatos; j++) {
                const celdaDato = document.createElement("td");
                const inputDato = document.createElement("input");

                inputDato.type = "number";
                inputDato.step = "0.1";
                inputDato.min = "0";
                inputDato.id = `m-${i}-c-${j}`;

                celdaDato.appendChild(inputDato);
                fila.appendChild(celdaDato);
            }
            tbody.appendChild(fila);
        }
    }

    // 2. Bloquear teclas 'e', 'E', '+' y '-' en todos los campos numéricos
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener("keydown", (evento) => {
            if (["e", "E", "+", "-"].includes(evento.key)) {
                evento.preventDefault();
            }
        });
    });

    // 3. Espejo en tiempo real de la cabecera (Página 1 -> Página 2)
    const espejos = [
        ["fecha", "fecha-p2"],
        ["orden-trabajo", "ot-p2"],
        ["cliente", "cliente-p2"],
        ["evaluador", "evaluador-p2"],
        ["producto", "producto-p2"],
        ["especie", "especie-p2"],
        ["codigo-producto", "codigo-p2"]
    ];

    espejos.forEach(([idOrigen, idDestino]) => {
        const origen = document.getElementById(idOrigen);
        const destino = document.getElementById(idDestino);
        if (origen && destino) {
            origen.addEventListener("input", () => destino.value = origen.value);
            origen.addEventListener("change", () => destino.value = origen.value);
        }
    });

});


