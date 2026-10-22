const quitarClave = (usuario = {}) => {
  const { clave, ...usuarioSeguro } = usuario;
  return usuarioSeguro;
};

export const usuarioParaSesion = (usuario) =>
  usuario ? quitarClave(usuario) : null;

export const persistirSesionSegura = (usuario) => {
  const seguro = usuarioParaSesion(usuario);

  if (seguro) {
    localStorage.setItem(
      'dh_sesion_v26',
      JSON.stringify(seguro)
    );
  } else {
    localStorage.removeItem('dh_sesion_v26');
  }

  return seguro;
};

export const persistirUsuariosSeguros = (usuarios = []) => {
  const seguros = usuarios.map(quitarClave);

  localStorage.setItem(
    'dh_usuarios_v26',
    JSON.stringify(seguros)
  );

  return seguros;
};

export const leerUsuariosSeguros = () => {
  try {
    const local = localStorage.getItem('dh_usuarios_v26');
    const usuarios = local ? JSON.parse(local) : [];

    // Elimina claves que pudieran haber quedado de versiones anteriores.
    persistirUsuariosSeguros(usuarios);

    return usuarios.map(quitarClave);
  } catch {
    return [];
  }
};
