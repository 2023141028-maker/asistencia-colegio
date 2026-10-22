import { supabase } from '../supabase';

export const crearEstudiante = async (estudiante) => {
  const { error } = await supabase.from('estudiantes').insert([estudiante]);
  if (error) throw error;
};

export const actualizarEstudiante = async (estudiante) => {
  const { error } = await supabase
    .from('estudiantes')
    .update({
      dni: estudiante.dni,
      name: estudiante.name,
      grade: estudiante.grade,
      section: estudiante.section,
      phone: estudiante.phone
    })
    .eq('id', estudiante.id);

  if (error) throw error;
};

export const eliminarEstudiante = async (id) => {
  const { error } = await supabase.from('estudiantes').delete().eq('id', id);
  if (error) throw error;
};
