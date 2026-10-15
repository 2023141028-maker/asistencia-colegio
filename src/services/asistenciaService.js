import { supabase } from '../supabase';

const conLimiteDeTiempo = (promesa, ms = 3000) => {
  return Promise.race([
    promesa,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT_CONEXION')), ms)
    )
  ]);
};
