import { supabase } from '../supabase';

const mapearUsuarioParaSupabase = (usuario) => ({
  id: usuario.id,
  usuario: usuario.usuario,
  clave: usuario.clave,
  rol: usuario.rol,
  nombre: usuario.nombre,
  aulas_asignadas: usuario.aulasAsignadas || []
});

export const guardarUsuario = async (usuario) => {
  const { error } = await supabase
    .from('usuarios')
    .upsert([mapearUsuarioParaSupabase(usuario)]);

  if (error) throw error;
};

export const actualizarUsuario = async (usuario) => {
  const { error } = await supabase
    .from('usuarios')
    .update({
      usuario: usuario.usuario,
      clave: usuario.clave,
      rol: usuario.rol,
      nombre: usuario.nombre,
      aulas_asignadas: usuario.aulasAsignadas || []
    })
    .eq('id', usuario.id);

  if (error) throw error;
};

export const eliminarUsuario = async (id) => {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
