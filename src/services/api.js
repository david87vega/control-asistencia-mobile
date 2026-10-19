
const API_URL = 'http://10.13.202.130:8080/api';

async function solicitar(endpoint, opciones = {}) {
    const respuesta = await fetch(`${API_URL}${endpoint}`, {
        ...opciones,
        headers: {
            'Content-Type': 'application/json',
            ...opciones.headers,
        },
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text();

        throw new Error(
            `Error HTTP ${respuesta.status}: ${detalle || respuesta.statusText}`
        );
    }

    if (respuesta.status === 204) {
        return null;
    }

    return respuesta.json();
}

export const listarFuncionarios = (soloActivos = true) => {
    return solicitar(
        `/funcionarios?soloActivos=${soloActivos}`
    );
};

export const obtenerFuncionario = (id) => {
    return solicitar(`/funcionarios/${id}`);
};

export const crearFuncionario = (funcionario) => {
    return solicitar('/funcionarios', {
        method: 'POST',
        body: JSON.stringify(funcionario),
    });
};

export const actualizarFuncionario = (id, funcionario) => {
    return solicitar(`/funcionarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(funcionario),
    });
};

export const cambiarEstadoFuncionario = (id, activo) => {
    return solicitar(`/funcionarios/${id}/activo`, {
        method: 'PATCH',
        body: JSON.stringify({ activo }),
    });
};

export const consultarMarcaciones = (fecha) => {
    return solicitar(
        `/marcaciones?fecha=${encodeURIComponent(fecha)}`
    );
};


export const listarDependencias = () => {
    return solicitar('/dependencias');
};

export const registrarMarcacion = (datos) =>
    solicitar('/marcaciones', {
        method: 'POST',
        body: JSON.stringify(datos),
    });


export const consultarReporteAsistencia = (
    desde,
    hasta,
    dependenciaId = null,
    funcionarioId = null
) => {
    const parametros = new URLSearchParams();

    parametros.append('desde', desde);
    parametros.append('hasta', hasta);

    if (dependenciaId !== null && dependenciaId !== '') {
        parametros.append('dependenciaId', String(dependenciaId));
    }

    if (funcionarioId !== null && funcionarioId !== '') {
        parametros.append('funcionarioId', String(funcionarioId));
    }

    return solicitar(`/marcaciones/reporte?${parametros.toString()}`);
};

