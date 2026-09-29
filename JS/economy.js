/* =========================================================
   SUPERLIGA ECONOMY DASHBOARD
   ========================================================= */


/* ---------------------------------------------------------
   SUPABASE
   --------------------------------------------------------- */

const SUPABASE_URL = "https://bxgkacenzipwwbawftdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2thY2Vuemlwd3diYXdmdGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEyNDQsImV4cCI6MjEwNjI4NzI0NH0.V4jfI7wDvKN-yePelVeAeA-3pEByfwS99o3s7k-vSWs";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ---------------------------------------------------------
   TEAM
   --------------------------------------------------------- */

const params = new URLSearchParams(window.location.search);

const abrev = params.get("equipo");


if (!abrev) {

    showError(
        "No se ha especificado ningún equipo. " +
        "Utiliza economy.html?equipo=bod"
    );

    throw new Error("Falta el parámetro equipo");

}


/* ---------------------------------------------------------
   HELPERS
   --------------------------------------------------------- */

function formatMoney(value) {

    const number = Number(value || 0);

    return number.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " M";

}


function formatDate(date) {

    if (!date) return "-";

    return new Date(date).toLocaleDateString(
        "es-ES",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function showError(message) {

    const element = document.getElementById("error");

    element.textContent = message;

    element.classList.remove("hidden");

    document.getElementById("status").textContent =
        "Error";

}


/* ---------------------------------------------------------
   LOAD DASHBOARD
   --------------------------------------------------------- */

async function loadDashboard() {

    setStatus("Cargando...");

    try {

        const { data, error } = await supabaseClient
            .from("economyDashboard")
            .select("*")
            .eq("abrev", abrev)
            .single();


        if (error) {
            throw error;
        }


        if (!data) {
            throw new Error(
                `No existe información para ${abrev}`
            );
        }


        renderDashboard(data);

        await loadHistory();

        await loadEvolution();

        setStatus("Actualizado");


    } catch (error) {

        console.error(error);

        showError(
            "No se ha podido cargar la información económica."
        );

    }

}


/* ---------------------------------------------------------
   DASHBOARD DATA
   --------------------------------------------------------- */

function renderDashboard(data) {

    document.title =
        `${data.equipo} · Economy`;

    document.getElementById("teamName")
        .textContent = data.equipo;

    document.getElementById("teamAbrev")
        .textContent = data.abrev.toUpperCase();

    document.getElementById("teamDivision")
        .textContent =
        data.division === 1
            ? "Primera División"
            : "Segunda División";


    document.getElementById("capitalActual")
        .textContent =
        formatMoney(data.capital_actual);


    document.getElementById("forecast")
        .textContent =
        formatMoney(data.prevision_final);


    document.getElementById("potential")
        .textContent =
        Number(data.potential || 0)
            .toFixed(2);


    document.getElementById("potentialMeta")
        .textContent =
        `División ${data.division_pot} · Global ${data.global_pot}`;


    document.getElementById("forecastLiga")
        .textContent =
        formatMoney(data.liga);


    document.getElementById("forecastCopa")
        .textContent =
        formatMoney(data.copa_ko);


    document.getElementById("forecastEurope")
        .textContent =
        formatMoney(data.comp_europea);


    document.getElementById("forecastTiempo")
        .textContent =
        formatMoney(data.tiempo_superliga);


    document.getElementById("forecastOC")
        .textContent =
        formatMoney(data.oc_obligatorias);


    document.getElementById("forecastSalary")
        .textContent =
        "-" + formatMoney(data.suma_total);


    createForecastChart(data);

}


/* ---------------------------------------------------------
   HISTORY
   --------------------------------------------------------- */

async function loadHistory() {

    const { data, error } = await supabaseClient

        .from("economyHistory")

        .select("*")

        .eq("abrev", abrev)

        .order("created_at", {
            ascending: false
        });


    if (error) {
        throw error;
    }


    document.getElementById("movementCount")
        .textContent = data.length;


    renderTransactions(data);

}


/* ---------------------------------------------------------
   TRANSACTIONS
   --------------------------------------------------------- */

function renderTransactions(data) {

    const tbody =
        document.getElementById("transactions");


    if (!data.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No hay movimientos registrados
                </td>
            </tr>
        `;

        return;
    }


    let income = 0;

    let expenses = 0;


    tbody.innerHTML =
        data.map(transaction => {

            const isIncome =
                transaction.tipo === "INGRESO";


            const amount =
                Number(transaction.cantidad || 0);


            if (isIncome) {
                income += amount;
            } else {
                expenses += amount;
            }


            const sign =
                isIncome ? "+" : "-";


            return `

                <tr>

                    <td>
                        ${formatDate(transaction.created_at)}
                    </td>

                    <td>
                        <span class="badge ${
                            isIncome
                                ? "income"
                                : "expense"
                        }">
                            ${escapeHtml(transaction.tipo)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(transaction.concepto)}
                    </td>

                    <td>
                        <span class="reference">
                            ${escapeHtml(
                                transaction.referencia || "-"
                            )}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(
                            transaction.temporada || "-"
                        )}
                    </td>

                    <td class="amount ${
                        isIncome
                            ? "positive"
                            : "negative"
                    }">

                        ${sign}${formatMoney(amount)}

                    </td>

                </tr>

            `;

        }).join("");


    document.getElementById("totalIncome")
        .textContent =
        "+" + formatMoney(income);


    document.getElementById("totalExpenses")
        .textContent =
        "-" + formatMoney(expenses);

}


/* ---------------------------------------------------------
   EVOLUTION
   --------------------------------------------------------- */

async function loadEvolution() {

    const { data, error } = await supabaseClient

        .from("economyEvolution")

        .select("*")

        .eq("abrev", abrev)

        .order("created_at", {
            ascending: true
        })

        .order("id", {
            ascending: true
        });


    if (error) {
        throw error;
    }


    createCapitalChart(data);

}


/* ---------------------------------------------------------
   CAPITAL CHART
   --------------------------------------------------------- */

function createCapitalChart(data) {

    const canvas =
        document.getElementById("capitalChart");


    const labels =
        data.map((item, index) =>
            `${index + 1}. ${item.concepto}`
        );


    const values =
        data.map(item =>
            Number(item.capital || 0)
        );


    new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label: "Capital",

                data: values,

                tension: 0.35,

                fill: true,

                pointRadius: 3,

                pointHoverRadius: 6

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                y: {

                    ticks: {

                        callback: value =>
                            value + " M"

                    }

                }

            }

        }

    });

}


/* ---------------------------------------------------------
   FORECAST CHART
   --------------------------------------------------------- */

function createForecastChart(data) {

    const canvas =
        document.getElementById("forecastChart");


    new Chart(canvas, {

        type: "bar",

        data: {

            labels: [
                "Capital",
                "Liga",
                "Copa",
                "Europa",
                "Tiempo",
                "OC",
                "Salarios",
                "Final"
            ],

            datasets: [{

                label: "Millones",

                data: [

                    Number(data.capital_actual || 0),

                    Number(data.liga || 0),

                    Number(data.copa_ko || 0),

                    Number(data.comp_europea || 0),

                    Number(data.tiempo_superliga || 0),

                    Number(data.oc_obligatorias || 0),

                    -Number(data.suma_total || 0),

                    Number(data.prevision_final || 0)

                ]

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                y: {

                    ticks: {

                        callback: value =>
                            value + " M"

                    }

                }

            }

        }

    });

}


/* ---------------------------------------------------------
   STATUS
   --------------------------------------------------------- */

function setStatus(text) {

    document.getElementById("status")
        .textContent = text;

}


/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */

loadDashboard();

